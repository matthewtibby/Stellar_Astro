from astropy.io import fits
from typing import Dict, List, Tuple, Optional, Set
import numpy as np
import re
from datetime import datetime

class CameraInfo:
    def __init__(self, name: str, is_color: bool, pixel_size: float, 
                 max_gain: int, has_cooling: bool = True):
        self.name = name
        self.is_color = is_color
        self.pixel_size = pixel_size
        self.max_gain = max_gain
        self.has_cooling = has_cooling

class FilterManufacturer:
    def __init__(self, name: str, filters: Dict[str, Dict[str, List[int]]]):
        self.name = name
        self.filters = filters  # Dict[filter_type, Dict[filter_name, bandwidths]]

class TargetType:
    def __init__(self, name: str, recommended_filters: List[str], min_exposure: float):
        self.name = name
        self.recommended_filters = recommended_filters
        self.min_exposure = min_exposure  # Minimum recommended exposure in seconds

class FilterHistory:
    def __init__(self):
        self.entries: List[Dict] = []
        self.target_stats: Dict[str, Dict[str, float]] = {}  # target_type -> filter -> success_rate
        self.filter_stats: Dict[str, Dict[str, float]] = {}  # filter -> target_type -> success_rate
    
    def add_entry(self, filter_info: 'FilterInfo', target: str, exposure: float, 
                 date: datetime, quality_score: float):
        """Add a new entry to the filter history with enhanced statistics tracking."""
        entry = {
            'filter': filter_info,
            'target': target,
            'exposure': exposure,
            'date': date,
            'quality_score': quality_score
        }
        self.entries.append(entry)
        
        # Update target statistics
        if target not in self.target_stats:
            self.target_stats[target] = {}
        if filter_info.name not in self.target_stats[target]:
            self.target_stats[target][filter_info.name] = 0.0
        self.target_stats[target][filter_info.name] = (
            self.target_stats[target][filter_info.name] * 0.9 + quality_score * 0.1
        )
        
        # Update filter statistics
        if filter_info.name not in self.filter_stats:
            self.filter_stats[filter_info.name] = {}
        if target not in self.filter_stats[filter_info.name]:
            self.filter_stats[filter_info.name][target] = 0.0
        self.filter_stats[filter_info.name][target] = (
            self.filter_stats[filter_info.name][target] * 0.9 + quality_score * 0.1
        )
    
    def get_recommended_filter(self, target: str) -> Optional['FilterInfo']:
        """Get recommended filter based on historical success with similar targets."""
        # First check exact target matches
        if target in self.target_stats:
            best_filter = max(
                self.target_stats[target].items(),
                key=lambda x: x[1]
            )[0]
            return FilterInfo(best_filter)
        
        # Then check similar targets
        similar_targets = self._find_similar_targets(target)
        if similar_targets:
            # Calculate weighted average success rates
            filter_scores = {}
            for similar_target in similar_targets:
                for filter_name, score in self.target_stats[similar_target].items():
                    if filter_name not in filter_scores:
                        filter_scores[filter_name] = 0.0
                    filter_scores[filter_name] += score
            
            if filter_scores:
                best_filter = max(filter_scores.items(), key=lambda x: x[1])[0]
                return FilterInfo(best_filter)
        
        return None
    
    def get_filter_recommendations(self, target: str, limit: int = 5) -> List[Tuple[str, float]]:
        """Get multiple filter recommendations with confidence scores."""
        recommendations = []
        
        # Add exact target matches
        if target in self.target_stats:
            for filter_name, score in self.target_stats[target].items():
                recommendations.append((filter_name, score))
        
        # Add similar target matches
        similar_targets = self._find_similar_targets(target)
        for similar_target in similar_targets:
            for filter_name, score in self.target_stats[similar_target].items():
                recommendations.append((filter_name, score * 0.8))  # Weight similar targets lower
        
        # Sort by score and return top recommendations
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations[:limit]
    
    def _find_similar_targets(self, target: str) -> List[str]:
        """Find similar targets based on name and type."""
        target_lower = target.lower()
        similar = []
        
        # Check for common patterns
        patterns = {
            'nebula': ['nebula', 'neb', 'sh2-', 'ngc', 'ic'],
            'galaxy': ['galaxy', 'm31', 'm33', 'ngc', 'ic'],
            'cluster': ['cluster', 'm13', 'm92', 'ngc'],
            'planetary': ['planetary', 'pl', 'm27', 'm57']
        }
        
        for pattern, keywords in patterns.items():
            if any(keyword in target_lower for keyword in keywords):
                similar.extend([
                    t for t in self.target_stats.keys()
                    if any(k in t.lower() for k in keywords)
                ])
        
        return list(set(similar))  # Remove duplicates

class FilterInfo:
    def __init__(self, name: str, bandwidth: Optional[float] = None):
        self.name = name
        self.bandwidth = bandwidth
        self.is_combination = False
        self.components: Set[str] = set()
        self.manufacturer: Optional[str] = None
        self.target_recommendations: List[str] = []
        
    def __str__(self) -> str:
        base = self.name
        if self.manufacturer:
            base = f"{self.manufacturer} {base}"
        if self.bandwidth:
            base = f"{base} ({self.bandwidth}nm)"
        return base
    
    def matches_target(self, target_type: str) -> bool:
        """Check if filter is recommended for target type."""
        if target_type not in TARGET_TYPES:
            return False
        return self.name in TARGET_TYPES[target_type].recommended_filters

# Database of known cameras and their characteristics
KNOWN_CAMERAS = {
    'ZWO ASI294MC Pro': CameraInfo(
        name='ZWO ASI294MC Pro',
        is_color=True,
        pixel_size=4.63,
        max_gain=600,
        has_cooling=True
    ),
    'ZWO ASI533MC Pro': CameraInfo(
        name='ZWO ASI533MC Pro',
        is_color=True,
        pixel_size=3.76,
        max_gain=300,
        has_cooling=True
    ),
    'ZWO ASI2600MC Pro': CameraInfo(
        name='ZWO ASI2600MC Pro',
        is_color=True,
        pixel_size=3.76,
        max_gain=300,
        has_cooling=True
    ),
    # Add more cameras as needed
}

# Database of known filter manufacturers and their products
FILTER_MANUFACTURERS = {
    'Optolong': FilterManufacturer('Optolong', {
        'narrowband': {
            'L-eXtreme': [7],
            'L-Ultimate': [3],
            'L-eNhance': [7],
            'L-Pro': [None],  # Broadband
            'L-Quad': [3],  # Quad-band Ha/OIII/SII/Hb
            'L-Enhance': [7],  # Enhanced broadband
            'L-UV/IR': [None],  # UV/IR cut
            'L-Deep': [3],  # Deep sky
            'L-Planetary': [None],  # Planetary
            'L-Solar': [None],  # Solar
        },
        'broadband': {
            'L-RGB': [None],
            'UV/IR Cut': [None],
            'L-Enhance': [None],
            'L-Pro': [None],
            'L-Deep': [None],
        },
        'specialized': {
            'L-eXtreme Duo': [7],  # Ha/OIII
            'L-Ultimate Duo': [3],  # Ha/OIII
            'L-eNhance Tri': [7],  # Ha/OIII/SII
            'L-Quad': [3],  # Ha/OIII/SII/Hb
            'L-Solar': [None],  # Solar
            'L-Planetary': [None],  # Planetary
        }
    }),
    'Astronomik': FilterManufacturer('Astronomik', {
        'narrowband': {
            'Ha': [6, 12],
            'OIII': [6, 12],
            'SII': [6, 12],
            'Hb': [6, 12],
            'Deep-Sky': [6],
            'UHC': [12],
            'OIII/Hb': [6],
            'Ha/Hb': [6],
        },
        'broadband': {
            'L-RGB': [None],
            'UV/IR Cut': [None],
            'CLS-CCD': [None],
            'CLS': [None],
            'Deep-Sky': [None],
            'Type 2c': [None],
        },
        'specialized': {
            'Planetary': [None],
            'Solar': [None],
            'UHC': [12],
            'Deep-Sky': [6],
        }
    }),
    'ZWO': FilterManufacturer('ZWO', {
        'narrowband': {
            'Ha': [3, 6, 7],
            'OIII': [3, 6, 7],
            'SII': [3, 6, 7],
            'Hb': [3, 6, 7],
            'UHC': [12],
            'Deep-Sky': [6],
        },
        'duoband': {
            'Duo-Band': [6, 12],  # Ha/OIII
            'Ha/OIII': [6, 12],
            'Ha/Hb': [6],
            'OIII/Hb': [6],
        },
        'broadband': {
            'UV/IR Cut': [None],
            'L-RGB': [None],
            'CLS': [None],
            'Deep-Sky': [None],
        },
        'specialized': {
            'Planetary': [None],
            'Solar': [None],
            'UHC': [12],
            'Deep-Sky': [6],
        }
    }),
    'Baader': FilterManufacturer('Baader', {
        'narrowband': {
            'Ha': [3.5, 7],
            'OIII': [3.5, 7],
            'SII': [3.5, 7],
            'Hb': [3.5, 7],
            'UHC': [12],
            'Deep-Sky': [6],
        },
        'broadband': {
            'L-RGB': [None],
            'UV/IR Cut': [None],
            'CLS': [None],
            'Deep-Sky': [None],
            'Type 2c': [None],
        },
        'specialized': {
            'Planetary': [None],
            'Solar': [None],
            'UHC': [12],
            'Deep-Sky': [6],
            'Contrast Booster': [None],
        }
    }),
    'Chroma': FilterManufacturer('Chroma', {
        'narrowband': {
            'Ha': [3, 5, 7],
            'OIII': [3, 5, 7],
            'SII': [3, 5, 7],
            'Hb': [3, 5, 7],
            'UHC': [12],
            'Deep-Sky': [6],
        },
        'broadband': {
            'L-RGB': [None],
            'UV/IR Cut': [None],
            'CLS': [None],
            'Deep-Sky': [None],
        },
        'specialized': {
            'Planetary': [None],
            'Solar': [None],
            'UHC': [12],
            'Deep-Sky': [6],
            'Quad-Band': [3],  # Ha/OIII/SII/Hb
        }
    })
}

# Database of target types and recommended filters with enhanced recommendations
TARGET_TYPES = {
    'emission_nebula': TargetType(
        'Emission Nebula',
        ['Ha', 'OIII', 'SII', 'Duo-Band', 'Tri-Band', 'Quad-Band', 'UHC', 'Deep-Sky'],
        180.0
    ),
    'galaxy': TargetType(
        'Galaxy',
        ['L-RGB', 'Ha (for enhanced H-II regions)', 'UV/IR Cut', 'Deep-Sky', 'CLS'],
        300.0
    ),
    'planetary_nebula': TargetType(
        'Planetary Nebula',
        ['OIII', 'Ha', 'Duo-Band', 'Tri-Band', 'UHC'],
        120.0
    ),
    'reflection_nebula': TargetType(
        'Reflection Nebula',
        ['L-RGB', 'UV/IR Cut', 'Deep-Sky', 'CLS'],
        300.0
    ),
    'globular_cluster': TargetType(
        'Globular Cluster',
        ['L-RGB', 'UV/IR Cut', 'Deep-Sky', 'CLS'],
        120.0
    ),
    'open_cluster': TargetType(
        'Open Cluster',
        ['L-RGB', 'UV/IR Cut', 'Deep-Sky', 'CLS'],
        120.0
    ),
    'supernova_remnant': TargetType(
        'Supernova Remnant',
        ['Ha', 'OIII', 'SII', 'Duo-Band', 'Tri-Band', 'UHC'],
        300.0
    ),
    'dark_nebula': TargetType(
        'Dark Nebula',
        ['L-RGB', 'UV/IR Cut', 'Deep-Sky', 'CLS'],
        300.0
    ),
    'planetary': TargetType(
        'Planetary',
        ['Planetary', 'UV/IR Cut', 'L-RGB'],
        0.1
    ),
    'solar': TargetType(
        'Solar',
        ['Solar', 'Ha', 'UV/IR Cut'],
        0.1
    )
}

class CaptureSoftware:
    def __init__(self, name: str, filter_wheel_support: bool, filter_presets: Dict[str, List[str]]):
        self.name = name
        self.filter_wheel_support = filter_wheel_support
        self.filter_presets = filter_presets

# Database of supported capture software
CAPTURE_SOFTWARE = {
    'ASIAIR': CaptureSoftware(
        'ASIAIR',
        True,
        {
            'Emission Nebula': ['Ha', 'OIII', 'SII', 'Duo-Band', 'Tri-Band'],
            'Galaxy': ['L-RGB', 'Ha', 'UV/IR Cut'],
            'Planetary Nebula': ['OIII', 'Ha', 'Duo-Band'],
            'Reflection Nebula': ['L-RGB', 'UV/IR Cut'],
            'Globular Cluster': ['L-RGB', 'UV/IR Cut'],
            'Planetary': ['Planetary', 'UV/IR Cut'],
            'Solar': ['Solar', 'Ha']
        }
    ),
    'NINA': CaptureSoftware(
        'NINA',
        True,
        {
            'Emission Nebula': ['Ha', 'OIII', 'SII', 'Duo-Band', 'Tri-Band', 'Quad-Band'],
            'Galaxy': ['L-RGB', 'Ha', 'UV/IR Cut', 'Deep-Sky'],
            'Planetary Nebula': ['OIII', 'Ha', 'Duo-Band', 'Tri-Band'],
            'Reflection Nebula': ['L-RGB', 'UV/IR Cut', 'Deep-Sky'],
            'Globular Cluster': ['L-RGB', 'UV/IR Cut', 'Deep-Sky'],
            'Planetary': ['Planetary', 'UV/IR Cut', 'L-RGB'],
            'Solar': ['Solar', 'Ha', 'UV/IR Cut']
        }
    ),
    'SharpCap': CaptureSoftware(
        'SharpCap',
        True,
        {
            'Emission Nebula': ['Ha', 'OIII', 'SII', 'Duo-Band', 'Tri-Band'],
            'Galaxy': ['L-RGB', 'Ha', 'UV/IR Cut'],
            'Planetary Nebula': ['OIII', 'Ha', 'Duo-Band'],
            'Reflection Nebula': ['L-RGB', 'UV/IR Cut'],
            'Globular Cluster': ['L-RGB', 'UV/IR Cut'],
            'Planetary': ['Planetary', 'UV/IR Cut'],
            'Solar': ['Solar', 'Ha']
        }
    ),
    'Sequence Generator Pro': CaptureSoftware(
        'Sequence Generator Pro',
        True,
        {
            'Emission Nebula': ['Ha', 'OIII', 'SII', 'Duo-Band', 'Tri-Band', 'Quad-Band'],
            'Galaxy': ['L-RGB', 'Ha', 'UV/IR Cut', 'Deep-Sky'],
            'Planetary Nebula': ['OIII', 'Ha', 'Duo-Band', 'Tri-Band'],
            'Reflection Nebula': ['L-RGB', 'UV/IR Cut', 'Deep-Sky'],
            'Globular Cluster': ['L-RGB', 'UV/IR Cut', 'Deep-Sky'],
            'Planetary': ['Planetary', 'UV/IR Cut', 'L-RGB'],
            'Solar': ['Solar', 'Ha', 'UV/IR Cut']
        }
    )
}

class FilterPreset:
    def __init__(self, name: str, filters: List[str], description: str):
        self.name = name
        self.filters = filters
        self.description = description

# Common filter presets
FILTER_PRESETS = {
    'Emission Nebula Basic': FilterPreset(
        'Emission Nebula Basic',
        ['Ha', 'OIII', 'SII'],
        'Basic narrowband set for emission nebulae'
    ),
    'Emission Nebula Advanced': FilterPreset(
        'Emission Nebula Advanced',
        ['Ha', 'OIII', 'SII', 'Hb', 'Duo-Band', 'Tri-Band'],
        'Advanced set for emission nebulae including combination filters'
    ),
    'Galaxy Basic': FilterPreset(
        'Galaxy Basic',
        ['L-RGB', 'Ha'],
        'Basic set for galaxy imaging'
    ),
    'Galaxy Advanced': FilterPreset(
        'Galaxy Advanced',
        ['L-RGB', 'Ha', 'OIII', 'SII', 'Deep-Sky'],
        'Advanced set for galaxy imaging including narrowband'
    ),
    'Planetary Nebula': FilterPreset(
        'Planetary Nebula',
        ['OIII', 'Ha', 'Duo-Band', 'Tri-Band'],
        'Set optimized for planetary nebulae'
    ),
    'Reflection Nebula': FilterPreset(
        'Reflection Nebula',
        ['L-RGB', 'UV/IR Cut', 'Deep-Sky'],
        'Set optimized for reflection nebulae'
    ),
    'Globular Cluster': FilterPreset(
        'Globular Cluster',
        ['L-RGB', 'UV/IR Cut', 'Deep-Sky'],
        'Set optimized for globular clusters'
    ),
    'Planetary': FilterPreset(
        'Planetary',
        ['Planetary', 'UV/IR Cut', 'L-RGB'],
        'Set optimized for planetary imaging'
    ),
    'Solar': FilterPreset(
        'Solar',
        ['Solar', 'Ha', 'UV/IR Cut'],
        'Set optimized for solar imaging'
    )
}

def detect_camera(header: fits.header.Header) -> Optional[CameraInfo]:
    """Detect camera model from FITS headers and return its characteristics."""
    # Try different common header keywords for camera/instrument
    camera_keys = ['INSTRUME', 'CAMERA', 'DETECTOR']
    camera_name = None
    
    for key in camera_keys:
        if key in header:
            camera_name = str(header[key]).strip()
            if camera_name in KNOWN_CAMERAS:
                return KNOWN_CAMERAS[camera_name]
    
    # Try pattern matching if exact match not found
    if camera_name:
        for known_camera in KNOWN_CAMERAS:
            if known_camera.lower() in camera_name.lower():
                return KNOWN_CAMERAS[known_camera]
    
    return None

def infer_frame_type(header: fits.header.Header, camera_info: Optional[CameraInfo] = None) -> str:
    """Infer frame type from headers and camera characteristics."""
    # Check explicit frame type headers
    type_keys = ['IMAGETYP', 'FRAME', 'OBSTYPE']
    for key in type_keys:
        if key in header:
            frame_type = str(header[key]).strip().lower()
            if 'light' in frame_type or 'object' in frame_type:
                return 'light'
            elif 'dark' in frame_type:
                return 'dark'
            elif 'flat' in frame_type:
                return 'flat'
            elif 'bias' in frame_type or 'zero' in frame_type:
                return 'bias'
    
    # Infer from exposure time and other characteristics
    exptime = float(header.get('EXPTIME', 0))
    if exptime == 0 or exptime < 0.01:
        return 'bias'
    elif exptime < 5.0 and 'flat' in str(header.get('OBJECT', '')).lower():
        return 'flat'
    elif exptime > 10 and header.get('OBJECT'):
        return 'light'
    elif not header.get('FILTER') and not header.get('OBJECT'):
        return 'dark'
    
    return 'unknown'

def identify_manufacturer(filter_name: str) -> Optional[str]:
    """Identify filter manufacturer from name."""
    for mfr_name, mfr in FILTER_MANUFACTURERS.items():
        for category in mfr.filters.values():
            if any(filter_name.lower() in f.lower() for f in category.keys()):
                return mfr_name
    return None

def get_target_type(header: fits.header.Header) -> Optional[str]:
    """Infer target type from header information."""
    object_name = str(header.get('OBJECT', '')).lower()
    
    # Common patterns for target types
    patterns = {
        'emission_nebula': r'nebula|neb|sh2-|ngc\s*\d+|ic\s*\d+',
        'galaxy': r'galaxy|m31|m33|ngc\s*\d+|ic\s*\d+',
        'planetary_nebula': r'planetary|pl\s*|ngc\s*\d+|m\s*27|m\s*57',
        'reflection_nebula': r'reflection|m45|pleiades',
        'globular_cluster': r'globular|m13|m92|ngc\s*\d+'
    }
    
    for target_type, pattern in patterns.items():
        if re.search(pattern, object_name):
            return target_type
            
    return None

def parse_filter_info(filter_str: str) -> Optional[FilterInfo]:
    """Parse filter string to extract name, bandwidth, and combination info."""
    if not filter_str:
        return None
        
    filter_str = filter_str.lower().strip()
    
    # Enhanced bandwidth detection
    bandwidth_patterns = [
        r'(\d+)(?:nm|nanometer)',
        r'(\d+\.\d+)(?:nm|nanometer)',
        r'(\d+)(?:\s*nm|\s*nanometer)',
        r'(\d+\.\d+)(?:\s*nm|\s*nanometer)',
        r'(\d+)(?:\s*bandwidth|\s*bw)',
        r'(\d+\.\d+)(?:\s*bandwidth|\s*bw)'
    ]
    
    bandwidth = None
    for pattern in bandwidth_patterns:
        match = re.search(pattern, filter_str)
        if match:
            try:
                bandwidth = float(match.group(1))
                break
            except ValueError:
                continue
    
    # Initialize filter info
    filter_info = FilterInfo(filter_str, bandwidth)
    
    # Enhanced manufacturer detection
    filter_info.manufacturer = identify_manufacturer(filter_str)
    
    # Enhanced combination filter detection
    combinations = {
        ('uv', 'ir'): 'UV/IR Cut',
        ('ha', 'oiii'): 'Duo-Band',
        ('ha', 'oiii', 'sii'): 'Tri-Band',
        ('ha', 'oiii', 'sii', 'hb'): 'Quad-Band',
        ('l', 'rgb'): 'LRGB',
        ('ha', 'hb'): 'Ha/Hb',
        ('oiii', 'hb'): 'OIII/Hb',
        ('deep', 'sky'): 'Deep-Sky',
        ('ultra', 'high', 'contrast'): 'UHC',
        ('light', 'pollution'): 'Light Pollution',
        ('city', 'light', 'suppression'): 'CLS',
        ('planetary'): 'Planetary',
        ('solar'): 'Solar'
    }
    
    # Check for combination filters with improved matching
    for components, name in combinations.items():
        if all(any(comp in word for word in filter_str.split()) for comp in components):
            filter_info.name = name
            filter_info.is_combination = True
            filter_info.components = set(components)
            break
    
    # If no combination found, try to match single filters
    if not filter_info.is_combination:
        single_filters = {
            'ha': 'Ha',
            'oiii': 'OIII',
            'sii': 'SII',
            'hb': 'Hb',
            'lrgb': 'LRGB',
            'uvir': 'UV/IR Cut',
            'uhc': 'UHC',
            'cls': 'CLS',
            'deepsky': 'Deep-Sky',
            'planetary': 'Planetary',
            'solar': 'Solar'
        }
        
        for pattern, name in single_filters.items():
            if pattern in filter_str.replace(' ', '').lower():
                filter_info.name = name
                break
    
    return filter_info

def get_filter_recommendations(header: fits.header.Header, camera_info: Optional[CameraInfo]) -> List[str]:
    """Get filter recommendations based on target type and camera."""
    target_type = get_target_type(header)
    if not target_type or target_type not in TARGET_TYPES:
        return []
    
    target_info = TARGET_TYPES[target_type]
    recommendations = []
    
    # Add target-specific recommendations
    recommendations.extend(target_info.recommended_filters)
    
    # Add camera-specific recommendations
    if camera_info and camera_info.is_color:
        recommendations.extend([
            'UV/IR Cut',
            'Light Pollution',
            'Duo-Band',
            'Tri-Band'
        ])
    
    return list(set(recommendations))  # Remove duplicates

def get_required_metadata_for_type(frame_type: str) -> Dict[str, str]:
    """Return essential metadata fields for each frame type with descriptions."""
    # Essential fields for all frame types
    common_fields = {
        'exposure_time': 'Exposure time in seconds',
        'gain': 'Camera gain setting',
        'temperature': 'CCD temperature in Celsius'
    }
    
    # Common filter types and combinations with bandwidths
    filter_types = {
        'color_camera': [
            'None (OSC only)',
            'UV/IR Cut',
            'Light Pollution',
            'Duo-Band Ha/OIII (6nm/7nm)',
            'Duo-Band Ha/OIII (12nm)',
            'Tri-Band Ha/OIII/SII (6nm/7nm)',
            'UV/IR Cut + Duo-Band',
            'UV/IR Cut + Light Pollution'
        ],
        'mono_camera': [
            'LRGB Set',
            'Narrowband Set Ha/OIII/SII',
            'Ha (3nm)',
            'Ha (6nm/7nm)',
            'OIII (3nm)',
            'OIII (6nm/7nm)',
            'SII (3nm)',
            'SII (6nm/7nm)'
        ]
    }
    
    # Type-specific essential fields
    type_specific = {
        'light': {
            'object': 'Name of the target object',
            'filter': f"Filter used - Color Camera: {', '.join(filter_types['color_camera'])} | Mono: {', '.join(filter_types['mono_camera'])}",
            'focal_length': 'Telescope focal length in mm'
        },
        'flat': {
            'filter': 'Filter used (must exactly match light frames)'
        },
        'dark': {},  # No additional required fields
        'bias': {}   # No additional required fields
    }
    
    return {**common_fields, **(type_specific.get(frame_type, {}))}

def infer_filter(header: fits.header.Header, camera_info: Optional[CameraInfo]) -> Optional[FilterInfo]:
    """Infer filter information from headers and camera type."""
    filter_keys = ['FILTER', 'FILT', 'FILTER1', 'FILTER2']
    
    # Check for filter in headers
    filter_str = None
    for key in filter_keys:
        if key in header:
            filter_str = str(header[key]).strip()
            break
    
    if not filter_str:
        # Special handling for color cameras
        if camera_info and camera_info.is_color:
            # Look for common filter keywords in headers
            header_str = str(header).lower()
            
            # Check for combination filters first
            if ('uv' in header_str or 'ir' in header_str) and ('duo' in header_str or 'ha' in header_str):
                return FilterInfo('UV/IR Cut + Duo-Band')
            elif ('uv' in header_str or 'ir' in header_str) and ('lp' in header_str or 'light pollution' in header_str):
                return FilterInfo('UV/IR Cut + Light Pollution')
            
            # Check for single filters
            if 'duo' in header_str or 'ha/oiii' in header_str or 'ha-oiii' in header_str:
                # Look for bandwidth
                if '6' in header_str or '7' in header_str:
                    return FilterInfo('Duo-Band Ha/OIII', 6)
                elif '12' in header_str:
                    return FilterInfo('Duo-Band Ha/OIII', 12)
                return FilterInfo('Duo-Band Ha/OIII')
            elif 'tri' in header_str or 'ha/oiii/sii' in header_str:
                if '6' in header_str or '7' in header_str:
                    return FilterInfo('Tri-Band Ha/OIII/SII', 6)
                return FilterInfo('Tri-Band Ha/OIII/SII')
            elif 'uv/ir' in header_str or 'uvir' in header_str:
                return FilterInfo('UV/IR Cut')
            elif 'lp' in header_str or 'light pollution' in header_str:
                return FilterInfo('Light Pollution')
    else:
        return parse_filter_info(filter_str)
            
    return None

def validate_flat_filter(light_filter: Optional[FilterInfo], flat_filter: Optional[FilterInfo]) -> Tuple[bool, str]:
    """Validate that flat frame filter matches light frame filter."""
    if not light_filter and not flat_filter:
        return True, ""
    
    if not light_filter:
        return False, "Light frame is missing filter information"
    if not flat_filter:
        return False, "Flat frame is missing filter information"
    
    # Enhanced validation for combination filters
    if light_filter.is_combination and flat_filter.is_combination:
        if light_filter.components != flat_filter.components:
            return False, f"Flat filter components {flat_filter.components} don't match light filter components {light_filter.components}"
        
        # Check manufacturer match for combination filters
        if light_filter.manufacturer != flat_filter.manufacturer:
            return False, f"Flat filter manufacturer {flat_filter.manufacturer} doesn't match light filter manufacturer {light_filter.manufacturer}"
    
    # Enhanced name matching with tolerance for common variations
    name_variations = {
        'uv/ir cut': ['uvir', 'uv-ir', 'uv ir'],
        'duo-band': ['duoband', 'dual band', 'dual-band'],
        'tri-band': ['triband', 'tri band', 'tri-band'],
        'quad-band': ['quadband', 'quad band', 'quad-band'],
        'l-rgb': ['lrgb', 'l rgb', 'l-rgb'],
        'ha': ['hydrogen alpha', 'h-alpha', 'h alpha'],
        'oiii': ['oxygen iii', 'o-iii', 'o iii'],
        'sii': ['sulfur ii', 's-ii', 's ii'],
        'hb': ['hydrogen beta', 'h-beta', 'h beta']
    }
    
    light_name = light_filter.name.lower()
    flat_name = flat_filter.name.lower()
    
    # Check for name variations
    for standard, variations in name_variations.items():
        if light_name in variations and flat_name not in variations:
            return False, f"Flat filter name '{flat_filter.name}' doesn't match light filter name '{light_filter.name}'"
    
    # Check exact name match if no variations found
    if light_name != flat_name:
        return False, f"Flat filter name '{flat_filter.name}' doesn't match light filter name '{light_filter.name}'"
    
    # Enhanced bandwidth validation
    if light_filter.bandwidth != flat_filter.bandwidth:
        # Allow small bandwidth differences for certain filter types
        if light_filter.name in ['Ha', 'OIII', 'SII', 'Hb']:
            if abs(light_filter.bandwidth - flat_filter.bandwidth) <= 1:
                return True, "Bandwidth difference within acceptable range"
        return False, f"Flat filter bandwidth {flat_filter.bandwidth}nm doesn't match light filter bandwidth {light_filter.bandwidth}nm"
    
    return True, ""

class FitsAnalysisResult:
    def __init__(self):
        self.type: str = 'unknown'
        self.confidence: float = 0.0
        self.warnings: List[str] = []
        self.suggestions: List[str] = []
        self.metadata: Dict = {}
        self.quality_metrics: Dict = {}
        self.missing_metadata: List[str] = []
        self.required_metadata: Dict[str, str] = {}
        self.camera_info: Optional[CameraInfo] = None
        self.inferred_values: Dict[str, str] = {}
        self.filter_info: Optional[FilterInfo] = None

def check_missing_metadata(result: FitsAnalysisResult) -> None:
    """Check for missing essential metadata based on frame type and update the result."""
    required_fields = get_required_metadata_for_type(result.type)
    result.required_metadata = required_fields
    
    for field, description in required_fields.items():
        normalized_field = field.replace('_', '').lower()
        # Check if field is missing or None in metadata
        is_missing = True
        for key, value in result.metadata.items():
            if key.replace('_', '').lower() == normalized_field and value is not None:
                is_missing = False
                break
        
        if is_missing:
            result.missing_metadata.append(field)
            result.warnings.append(f"Missing {field}: {description}")
            if field in ['filter', 'object', 'focal_length']:  # Only suggest for these fields
                result.suggestions.append(f"Please provide {field} information")

def analyze_fits_headers(header: fits.header.Header) -> FitsAnalysisResult:
    """
    Perform comprehensive analysis of FITS headers to determine frame type and quality.
    Returns a FitsAnalysisResult with type, confidence, warnings, and suggestions.
    """
    result = FitsAnalysisResult()
    
    # Detect camera and its characteristics
    result.camera_info = detect_camera(header)
    
    # Extract and infer metadata
    result.filter_info = infer_filter(header, result.camera_info)
    
    # Get target type and recommendations
    target_type = get_target_type(header)
    if target_type:
        recommendations = get_filter_recommendations(header, result.camera_info)
        if recommendations:
            result.suggestions.append("\nRecommended filters for this target type:")
            for rec in recommendations:
                result.suggestions.append(f"• {rec}")
    
    result.metadata = {
        'exposure_time': header.get('EXPTIME'),
        'filter': str(result.filter_info) if result.filter_info else None,
        'object': header.get('OBJECT'),
        'date_obs': header.get('DATE-OBS'),
        'instrument': header.get('INSTRUME'),
        'telescope': header.get('TELESCOP'),
        'gain': header.get('GAIN'),
        'temperature': header.get('CCD-TEMP') or header.get('CCDTEMP'),
        'binning': f"{header.get('XBINNING', 1)}x{header.get('YBINNING', 1)}",
        'image_type': header.get('IMAGETYP'),
        'observation_type': header.get('OBSTYPE'),
        'pixel_size': f"{header.get('XPIXSZ', '?')}x{header.get('YPIXSZ', '?')}",
        'focal_length': header.get('FOCALLEN'),
        'ra': header.get('RA'),
        'dec': header.get('DEC'),
        'creator': header.get('CREATOR'),
        'offset': header.get('OFFSET'),
        'egain': header.get('EGAIN'),
        'target_type': target_type
    }

    # Infer missing values from camera info
    if result.camera_info:
        if not result.metadata['pixel_size'] or '?' in result.metadata['pixel_size']:
            result.metadata['pixel_size'] = f"{result.camera_info.pixel_size}x{result.camera_info.pixel_size}"
            result.inferred_values['pixel_size'] = 'From camera database'
        
        if not result.filter_info:
            if result.camera_info.is_color:
                result.warnings.append("Color camera detected but no filter information found")
                if target_type:
                    result.suggestions.append(f"\nRecommended filters for {target_type}:")
                    for rec in get_filter_recommendations(header, result.camera_info):
                        result.suggestions.append(f"• {rec}")
                else:
                    result.suggestions.append("Common filter options:")
                    result.suggestions.append("• None (OSC only)")
                    result.suggestions.append("• UV/IR Cut")
                    result.suggestions.append("• Light Pollution")
                    result.suggestions.append("• Duo-Band Ha/OIII (6nm or 12nm)")
                    result.suggestions.append("• Tri-Band Ha/OIII/SII")
    
    # Determine frame type
    result.type = infer_frame_type(header, result.camera_info)
    
    # For flat frames, validate filter matches
    if result.type == 'flat':
        result.warnings.append("Ensure flat frame filter exactly matches light frame filter (including bandwidth)")
        if result.filter_info and result.filter_info.manufacturer:
            result.suggestions.append(f"Using {result.filter_info.manufacturer} filter - ensure same manufacturer for flats")
    
    # Calculate confidence based on available information
    confidence_factors = []
    
    if header.get('IMAGETYP'):
        confidence_factors.append(0.6)  # Explicit frame type
    if header.get('EXPTIME') is not None:
        confidence_factors.append(0.2)  # Has exposure time
    if result.camera_info:
        confidence_factors.append(0.2)  # Known camera
    if header.get('OBJECT') and result.type == 'light':
        confidence_factors.append(0.2)  # Has object name for light frame
    if result.filter_info:
        confidence_factors.append(0.2)  # Has filter info
        if result.filter_info.manufacturer:
            confidence_factors.append(0.1)  # Known manufacturer

    confidence = min(1.0, sum(confidence_factors))
    # Penalize zero or negative exposure for light frames
    if result.type == 'light' and (header.get('EXPTIME') is not None and header.get('EXPTIME') <= 0):
        confidence = max(0.0, confidence - 0.5)
        result.warnings.append('Exposure time is zero or negative for light frame')
    result.confidence = confidence
    
    # Check for missing essential metadata
    check_missing_metadata(result)
    
    # Add camera-specific information to output
    if result.camera_info:
        result.metadata['camera_type'] = 'Color' if result.camera_info.is_color else 'Mono'
        result.metadata['camera_model'] = result.camera_info.name
    
    return result

def check_common_issues(header: fits.header.Header, result: FitsAnalysisResult) -> None:
    """
    Check for common issues in FITS headers and add warnings/suggestions.
    """
    # Check for missing critical headers
    critical_headers = ['EXPTIME', 'DATE-OBS', 'INSTRUME']
    for header_name in critical_headers:
        if header_name not in header:
            result.warnings.append(f"Missing critical header: {header_name}")
    
    # Check exposure time
    exptime = header.get('EXPTIME')
    if exptime is not None:
        if exptime <= 0:
            result.warnings.append("Exposure time is zero or negative")
        elif exptime > 3600:
            result.warnings.append("Exposure time is unusually long (>1 hour)")
    
    # Check temperature
    temp = header.get('CCD-TEMP')
    if temp is not None:
        if abs(temp) > 50:
            result.warnings.append(f"Unusual CCD temperature: {temp}°C")
    
    # Check gain
    gain = header.get('GAIN')
    if gain is not None:
        if gain <= 0:
            result.warnings.append("Gain is zero or negative")
        elif gain > 100:
            result.warnings.append("Gain is unusually high")
    
    # Check for potential calibration issues
    if result.type == 'light':
        if not header.get('FILTER'):
            result.suggestions.append("Consider adding filter information")
        if not header.get('OBJECT'):
            result.suggestions.append("Consider adding object name")

def calculate_quality_metrics(header: fits.header.Header, result: FitsAnalysisResult) -> None:
    """
    Calculate quality metrics for the FITS file.
    """
    result.quality_metrics = {
        'header_completeness': calculate_header_completeness(header),
        'exposure_quality': calculate_exposure_quality(header),
        'temperature_stability': calculate_temperature_stability(header)
    }

def calculate_header_completeness(header: fits.header.Header) -> float:
    """
    Calculate how complete the FITS headers are (0-1).
    """
    required_headers = [
        'EXPTIME', 'DATE-OBS', 'INSTRUME', 'TELESCOP',
        'GAIN', 'CCD-TEMP', 'XBINNING', 'YBINNING'
    ]
    present = sum(1 for h in required_headers if h in header)
    return present / len(required_headers)

def calculate_exposure_quality(header: fits.header.Header) -> float:
    """
    Calculate exposure quality score (0-1).
    """
    exptime = header.get('EXPTIME')
    if exptime is None:
        return 0.0
    
    # Normalize exposure time to 0-1 range (assuming 0-3600s range)
    normalized = min(max(exptime / 3600, 0), 1)
    return normalized

def calculate_temperature_stability(header: fits.header.Header) -> float:
    """
    Calculate temperature stability score (0-1).
    """
    temp = header.get('CCD-TEMP')
    if temp is None:
        return 0.0
    
    # Score based on how close to -10°C (typical optimal temperature)
    optimal_temp = -10
    diff = abs(temp - optimal_temp)
    if diff > 20:
        return 0.0
    return 1 - (diff / 20)

def get_capture_software_presets(software_name: str, target_type: str) -> List[str]:
    """Get filter presets for a specific capture software and target type."""
    if software_name in CAPTURE_SOFTWARE:
        software = CAPTURE_SOFTWARE[software_name]
        if target_type in software.filter_presets:
            return software.filter_presets[target_type]
    return []

def get_filter_preset(preset_name: str) -> Optional[FilterPreset]:
    """Get a specific filter preset by name."""
    return FILTER_PRESETS.get(preset_name)

def get_recommended_presets(target_type: str) -> List[FilterPreset]:
    """Get recommended filter presets for a target type."""
    recommended = []
    for preset in FILTER_PRESETS.values():
        if any(filter_name in preset.filters for filter_name in TARGET_TYPES[target_type].recommended_filters):
            recommended.append(preset)
    return recommended 