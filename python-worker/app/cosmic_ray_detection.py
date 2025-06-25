"""
Cosmic Ray Detection Module

This module provides cosmic ray detection and removal functionality for astronomical images.
It implements multiple algorithms including L.A.Cosmic for robust cosmic ray identification.
"""

import numpy as np
from astropy.io import fits
from astropy.nddata import CCDData
import astroscrappy
from scipy import ndimage
from scipy.signal import medfilt2d
import logging
from typing import Tuple, Optional, Dict, Any
import warnings

logger = logging.getLogger(__name__)

class CosmicRayDetector:
    """
    Cosmic Ray Detection and Removal using multiple algorithms.
    
    Implements L.A.Cosmic (Laplacian Cosmic ray identification) algorithm
    and additional detection methods for robust cosmic ray removal.
    """
    
    def __init__(self, 
                 sigma_clip: float = 4.5,
                 sigma_frac: float = 0.3,
                 objlim: float = 5.0,
                 gain: float = 1.0,
                 readnoise: float = 6.5,
                 satlevel: float = 65535.0,
                 niter: int = 4,
                 sepmed: bool = True,
                 cleantype: str = 'meanmask',
                 fsmode: str = 'median',
                 psfmodel: str = 'gauss',
                 psffwhm: float = 2.5,
                 psfsize: int = 7,
                 psfk: Optional[np.ndarray] = None,
                 psfbeta: float = 4.765):
        """
        Initialize cosmic ray detector with L.A.Cosmic parameters.
        
        Parameters:
        -----------
        sigma_clip : float
            Sigma threshold for cosmic ray detection (default: 4.5)
        sigma_frac : float
            Fractional detection limit for neighboring pixels (default: 0.3)
        objlim : float
            Contrast limit between cosmic ray and underlying object (default: 5.0)
        gain : float
            CCD gain in electrons/ADU (default: 1.0)
        readnoise : float
            CCD readout noise in electrons (default: 6.5)
        satlevel : float
            Saturation level in ADU (default: 65535.0)
        niter : int
            Number of iterations (default: 4)
        sepmed : bool
            Use separate median filter (default: True)
        cleantype : str
            Type of cleaning ('meanmask', 'medmask', 'idw') (default: 'meanmask')
        fsmode : str
            Fine structure detection mode ('median', 'convolve') (default: 'median')
        psfmodel : str
            PSF model ('gauss', 'gaussx', 'gaussy', 'moffat') (default: 'gauss')
        psffwhm : float
            PSF FWHM in pixels (default: 2.5)
        psfsize : int
            PSF size in pixels (default: 7)
        psfk : np.ndarray, optional
            Custom PSF kernel (default: None)
        psfbeta : float
            Moffat beta parameter (default: 4.765)
        """
        self.sigma_clip = sigma_clip
        self.sigma_frac = sigma_frac
        self.objlim = objlim
        self.gain = gain
        self.readnoise = readnoise
        self.satlevel = satlevel
        self.niter = niter
        self.sepmed = sepmed
        self.cleantype = cleantype
        self.fsmode = fsmode
        self.psfmodel = psfmodel
        self.psffwhm = psffwhm
        self.psfsize = psfsize
        self.psfk = psfk
        self.psfbeta = psfbeta
        
    def detect_lacosmic(self, data: np.ndarray, mask: Optional[np.ndarray] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Detect cosmic rays using L.A.Cosmic algorithm.
        
        Parameters:
        -----------
        data : np.ndarray
            Input image data
        mask : np.ndarray, optional
            Input mask (True = masked pixels)
            
        Returns:
        --------
        cleaned_data : np.ndarray
            Image with cosmic rays removed
        crmask : np.ndarray
            Mask of detected cosmic rays (True = cosmic ray)
        """
        try:
            logger.info("Running L.A.Cosmic cosmic ray detection...")
            
            # Convert input mask format (astroscrappy uses 0=good, 1=bad)
            inmask = None
            if mask is not None:
                inmask = mask.astype(bool)
            
            # Run L.A.Cosmic detection
            crmask, cleaned_data = astroscrappy.detect_cosmics(
                data,
                inmask=inmask,
                sigclip=self.sigma_clip,
                sigfrac=self.sigma_frac,
                objlim=self.objlim,
                gain=self.gain,
                readnoise=self.readnoise,
                satlevel=self.satlevel,
                niter=self.niter,
                sepmed=self.sepmed,
                cleantype=self.cleantype,
                fsmode=self.fsmode,
                psfmodel=self.psfmodel,
                psffwhm=self.psffwhm,
                psfsize=self.psfsize,
                psfk=self.psfk,
                psfbeta=self.psfbeta,
                verbose=False
            )
            
            num_cosmic_rays = np.sum(crmask)
            logger.info(f"L.A.Cosmic detected {num_cosmic_rays} cosmic ray pixels")
            
            return cleaned_data, crmask
            
        except Exception as e:
            logger.error(f"L.A.Cosmic detection failed: {str(e)}")
            raise
    
    def detect_sigma_clipping(self, data: np.ndarray, 
                            sigma_threshold: float = 5.0,
                            kernel_size: int = 3) -> np.ndarray:
        """
        Simple cosmic ray detection using sigma clipping.
        
        Parameters:
        -----------
        data : np.ndarray
            Input image data
        sigma_threshold : float
            Sigma threshold for detection (default: 5.0)
        kernel_size : int
            Size of median filter kernel (default: 3)
            
        Returns:
        --------
        crmask : np.ndarray
            Mask of detected cosmic rays (True = cosmic ray)
        """
        try:
            logger.info("Running sigma clipping cosmic ray detection...")
            
            # Apply median filter to estimate background
            background = medfilt2d(data, kernel_size=kernel_size)
            
            # Calculate residual
            residual = data - background
            
            # Calculate statistics
            mean_residual = np.mean(residual)
            std_residual = np.std(residual)
            
            # Detect cosmic rays as high sigma outliers
            crmask = residual > (mean_residual + sigma_threshold * std_residual)
            
            num_cosmic_rays = np.sum(crmask)
            logger.info(f"Sigma clipping detected {num_cosmic_rays} cosmic ray pixels")
            
            return crmask
            
        except Exception as e:
            logger.error(f"Sigma clipping detection failed: {str(e)}")
            raise
    
    def detect_laplacian(self, data: np.ndarray, 
                        threshold: float = 0.1,
                        kernel_size: int = 3) -> np.ndarray:
        """
        Detect cosmic rays using Laplacian edge detection.
        
        Parameters:
        -----------
        data : np.ndarray
            Input image data
        threshold : float
            Threshold for edge detection (default: 0.1)
        kernel_size : int
            Size of Laplacian kernel (default: 3)
            
        Returns:
        --------
        crmask : np.ndarray
            Mask of detected cosmic rays (True = cosmic ray)
        """
        try:
            logger.info("Running Laplacian cosmic ray detection...")
            
            # Normalize data
            normalized_data = (data - np.min(data)) / (np.max(data) - np.min(data))
            
            # Apply Laplacian filter
            laplacian = ndimage.laplace(normalized_data)
            
            # Threshold to find edges (potential cosmic rays)
            crmask = np.abs(laplacian) > threshold
            
            # Morphological operations to clean up detection
            crmask = ndimage.binary_opening(crmask, structure=np.ones((2, 2)))
            crmask = ndimage.binary_closing(crmask, structure=np.ones((2, 2)))
            
            num_cosmic_rays = np.sum(crmask)
            logger.info(f"Laplacian detection found {num_cosmic_rays} cosmic ray pixels")
            
            return crmask
            
        except Exception as e:
            logger.error(f"Laplacian detection failed: {str(e)}")
            raise
    
    def clean_cosmic_rays(self, data: np.ndarray, crmask: np.ndarray,
                         method: str = 'median') -> np.ndarray:
        """
        Clean cosmic rays from image using specified method.
        
        Parameters:
        -----------
        data : np.ndarray
            Input image data
        crmask : np.ndarray
            Cosmic ray mask (True = cosmic ray)
        method : str
            Cleaning method ('median', 'interpolate', 'mean') (default: 'median')
            
        Returns:
        --------
        cleaned_data : np.ndarray
            Image with cosmic rays cleaned
        """
        try:
            cleaned_data = data.copy()
            
            if method == 'median':
                # Replace cosmic rays with median of surrounding pixels
                cleaned_data = medfilt2d(cleaned_data, kernel_size=3)
                cleaned_data[~crmask] = data[~crmask]  # Keep original non-CR pixels
                
            elif method == 'interpolate':
                # Use scipy interpolation
                from scipy.interpolate import griddata
                
                # Get coordinates of good pixels
                good_mask = ~crmask
                y_coords, x_coords = np.where(good_mask)
                values = data[good_mask]
                
                # Get coordinates of cosmic ray pixels
                cr_y, cr_x = np.where(crmask)
                
                if len(cr_y) > 0 and len(values) > 3:
                    # Interpolate cosmic ray pixels
                    interpolated = griddata(
                        (y_coords, x_coords), values, (cr_y, cr_x),
                        method='linear', fill_value=np.median(data)
                    )
                    cleaned_data[crmask] = interpolated
                    
            elif method == 'mean':
                # Replace with local mean
                kernel = np.ones((3, 3)) / 9
                convolved = ndimage.convolve(data, kernel)
                cleaned_data[crmask] = convolved[crmask]
                
            else:
                raise ValueError(f"Unknown cleaning method: {method}")
                
            logger.info(f"Cleaned {np.sum(crmask)} cosmic ray pixels using {method} method")
            return cleaned_data
            
        except Exception as e:
            logger.error(f"Cosmic ray cleaning failed: {str(e)}")
            raise
    
    def process_fits_file(self, fits_path: str, output_path: str = None,
                         method: str = 'lacosmic',
                         save_mask: bool = True) -> Dict[str, Any]:
        """
        Process a FITS file for cosmic ray detection and removal.
        
        Parameters:
        -----------
        fits_path : str
            Path to input FITS file
        output_path : str, optional
            Path to save cleaned FITS file (default: None, no save)
        method : str
            Detection method ('lacosmic', 'sigma_clip', 'laplacian') (default: 'lacosmic')
        save_mask : bool
            Whether to save cosmic ray mask (default: True)
            
        Returns:
        --------
        result : dict
            Dictionary containing processing results and statistics
        """
        try:
            logger.info(f"Processing FITS file: {fits_path}")
            
            # Load FITS file
            with fits.open(fits_path) as hdul:
                data = hdul[0].data.astype(np.float64)
                header = hdul[0].header
                
                # Extract camera parameters from header if available
                if 'GAIN' in header:
                    self.gain = float(header['GAIN'])
                if 'RDNOISE' in header or 'READNOIS' in header:
                    self.readnoise = float(header.get('RDNOISE', header.get('READNOIS', self.readnoise)))
                if 'SATURATE' in header or 'SATLEVEL' in header:
                    self.satlevel = float(header.get('SATURATE', header.get('SATLEVEL', self.satlevel)))
            
            # Detect cosmic rays using specified method
            if method == 'lacosmic':
                cleaned_data, crmask = self.detect_lacosmic(data)
            elif method == 'sigma_clip':
                crmask = self.detect_sigma_clipping(data)
                cleaned_data = self.clean_cosmic_rays(data, crmask)
            elif method == 'laplacian':
                crmask = self.detect_laplacian(data)
                cleaned_data = self.clean_cosmic_rays(data, crmask)
            else:
                raise ValueError(f"Unknown detection method: {method}")
            
            # Calculate statistics
            num_cosmic_rays = np.sum(crmask)
            cosmic_ray_percentage = (num_cosmic_rays / data.size) * 100
            
            result = {
                'method': method,
                'num_cosmic_rays': int(num_cosmic_rays),
                'cosmic_ray_percentage': float(cosmic_ray_percentage),
                'image_shape': data.shape,
                'parameters': {
                    'sigma_clip': self.sigma_clip,
                    'gain': self.gain,
                    'readnoise': self.readnoise,
                    'satlevel': self.satlevel,
                    'niter': self.niter
                }
            }
            
            # Save cleaned FITS file if requested
            if output_path:
                logger.info(f"Saving cleaned FITS file: {output_path}")
                
                # Create new FITS file with cleaned data
                with fits.open(fits_path) as hdul:
                    hdul[0].data = cleaned_data.astype(hdul[0].data.dtype)
                    hdul[0].header['HISTORY'] = f'Cosmic rays removed using {method}'
                    hdul[0].header['CRMETHOD'] = method
                    hdul[0].header['CRDETECT'] = num_cosmic_rays
                    hdul[0].header['CRPERCENT'] = cosmic_ray_percentage
                    hdul.writeto(output_path, overwrite=True)
                
                result['output_path'] = output_path
                
                # Save cosmic ray mask if requested
                if save_mask:
                    mask_path = output_path.replace('.fits', '_crmask.fits')
                    logger.info(f"Saving cosmic ray mask: {mask_path}")
                    
                    mask_hdu = fits.PrimaryHDU(crmask.astype(np.uint8))
                    mask_hdu.header['COMMENT'] = 'Cosmic ray mask: 1=cosmic ray, 0=good pixel'
                    mask_hdu.header['CRMETHOD'] = method
                    mask_hdu.writeto(mask_path, overwrite=True)
                    
                    result['mask_path'] = mask_path
            
            logger.info(f"Cosmic ray detection completed: {num_cosmic_rays} cosmic rays ({cosmic_ray_percentage:.2f}%)")
            return result
            
        except Exception as e:
            logger.error(f"FITS processing failed: {str(e)}")
            raise

    def auto_tune_parameters(self, data: np.ndarray) -> Dict[str, float]:
        """
        Automatically tune cosmic ray detection parameters based on image characteristics.
        
        Parameters:
        -----------
        data : np.ndarray
            Input image data
            
        Returns:
        --------
        tuned_params : dict
            Optimized parameters for this image
        """
        logger.info("Auto-tuning cosmic ray detection parameters...")
        
        # Calculate image statistics
        mean_val = np.mean(data)
        std_val = np.std(data)
        median_val = np.median(data)
        mad_val = np.median(np.abs(data - median_val))  # Median absolute deviation
        
        # Estimate background noise level
        noise_level = 1.4826 * mad_val  # Robust noise estimate
        
        # Estimate signal-to-noise ratio
        snr = mean_val / noise_level if noise_level > 0 else 1.0
        
        # Auto-tune parameters based on image characteristics
        tuned_params = {}
        
        # Adjust sigma_clip based on noise level
        if noise_level < 50:  # Low noise image
            tuned_params['sigma_clip'] = 5.0
            tuned_params['objlim'] = 3.0
        elif noise_level < 200:  # Medium noise
            tuned_params['sigma_clip'] = 4.5
            tuned_params['objlim'] = 4.0
        else:  # High noise image
            tuned_params['sigma_clip'] = 4.0
            tuned_params['objlim'] = 5.0
        
        # Adjust iterations based on expected cosmic ray density
        if snr > 100:  # High SNR - more iterations for better detection
            tuned_params['niter'] = 6
        elif snr > 50:  # Medium SNR
            tuned_params['niter'] = 4
        else:  # Low SNR - fewer iterations to avoid false positives
            tuned_params['niter'] = 3
        
        # Adjust sigma_frac based on image characteristics
        if mean_val > 10000:  # Bright image
            tuned_params['sigma_frac'] = 0.2
        else:  # Dim image
            tuned_params['sigma_frac'] = 0.3
        
        logger.info(f"Auto-tuned parameters: {tuned_params}")
        return tuned_params

    def detect_multi_algorithm(self, data: np.ndarray, 
                             methods: list = ['lacosmic', 'sigma_clip'],
                             combine_method: str = 'intersection') -> Tuple[np.ndarray, np.ndarray, Dict]:
        """
        Detect cosmic rays using multiple algorithms and combine results.
        
        Parameters:
        -----------
        data : np.ndarray
            Input image data
        methods : list
            List of detection methods to use
        combine_method : str
            How to combine results ('intersection', 'union', 'voting')
            
        Returns:
        --------
        cleaned_data : np.ndarray
            Image with cosmic rays removed
        combined_mask : np.ndarray
            Combined cosmic ray mask
        stats : dict
            Detection statistics for each method
        """
        logger.info(f"Running multi-algorithm detection with methods: {methods}")
        
        masks = {}
        stats = {}
        
        # Run each detection method
        for method in methods:
            try:
                if method == 'lacosmic':
                    cleaned, mask = self.detect_lacosmic(data)
                    masks[method] = mask
                elif method == 'sigma_clip':
                    mask = self.detect_sigma_clipping(data)
                    masks[method] = mask
                elif method == 'laplacian':
                    mask = self.detect_laplacian(data)
                    masks[method] = mask
                
                stats[method] = {
                    'num_detections': int(np.sum(masks[method])),
                    'percentage': float(np.sum(masks[method]) / data.size * 100)
                }
                logger.info(f"{method}: {stats[method]['num_detections']} detections ({stats[method]['percentage']:.2f}%)")
                
            except Exception as e:
                logger.error(f"Method {method} failed: {e}")
                continue
        
        if not masks:
            raise ValueError("All detection methods failed")
        
        # Combine masks based on specified method
        mask_arrays = list(masks.values())
        
        if combine_method == 'intersection':
            # Only pixels detected by ALL methods
            combined_mask = mask_arrays[0].copy()
            for mask in mask_arrays[1:]:
                combined_mask = combined_mask & mask
        elif combine_method == 'union':
            # Pixels detected by ANY method
            combined_mask = mask_arrays[0].copy()
            for mask in mask_arrays[1:]:
                combined_mask = combined_mask | mask
        elif combine_method == 'voting':
            # Majority voting - pixel is cosmic ray if detected by >50% of methods
            vote_sum = np.sum(mask_arrays, axis=0)
            threshold = len(mask_arrays) / 2
            combined_mask = vote_sum > threshold
        else:
            raise ValueError(f"Unknown combine method: {combine_method}")
        
        # Clean the image using the combined mask
        cleaned_data = self.clean_cosmic_rays(data, combined_mask, method='median')
        
        stats['combined'] = {
            'num_detections': int(np.sum(combined_mask)),
            'percentage': float(np.sum(combined_mask) / data.size * 100),
            'combine_method': combine_method
        }
        
        logger.info(f"Combined result: {stats['combined']['num_detections']} detections ({stats['combined']['percentage']:.2f}%)")
        
        return cleaned_data, combined_mask, stats

    def detect_batch(self, fits_paths: list, 
                    method: str = 'lacosmic',
                    auto_tune: bool = True,
                    progress_callback: callable = None) -> Dict[str, Dict]:
        """
        Process multiple FITS files in batch for cosmic ray detection.
        
        Parameters:
        -----------
        fits_paths : list
            List of FITS file paths to process
        method : str
            Detection method to use
        auto_tune : bool
            Whether to auto-tune parameters for each image
        progress_callback : callable
            Function to call with progress updates
            
        Returns:
        --------
        results : dict
            Dictionary with results for each file
        """
        logger.info(f"Starting batch processing of {len(fits_paths)} files")
        
        results = {}
        
        for i, fits_path in enumerate(fits_paths):
            try:
                logger.info(f"Processing file {i+1}/{len(fits_paths)}: {fits_path}")
                
                # Load FITS file
                with fits.open(fits_path) as hdul:
                    data = hdul[0].data.astype(np.float64)
                    header = hdul[0].header
                
                # Auto-tune parameters if requested
                original_params = {}
                if auto_tune:
                    original_params = {
                        'sigma_clip': self.sigma_clip,
                        'objlim': self.objlim,
                        'niter': self.niter,
                        'sigma_frac': self.sigma_frac
                    }
                    
                    tuned_params = self.auto_tune_parameters(data)
                    for param, value in tuned_params.items():
                        setattr(self, param, value)
                
                # Detect cosmic rays
                if method == 'lacosmic':
                    cleaned_data, crmask = self.detect_lacosmic(data)
                elif method == 'multi':
                    cleaned_data, crmask, multi_stats = self.detect_multi_algorithm(data)
                else:
                    crmask = getattr(self, f'detect_{method}')(data)
                    cleaned_data = self.clean_cosmic_rays(data, crmask)
                
                # Calculate statistics
                num_cosmic_rays = np.sum(crmask)
                cosmic_ray_percentage = (num_cosmic_rays / data.size) * 100
                
                results[fits_path] = {
                    'success': True,
                    'method': method,
                    'num_cosmic_rays': int(num_cosmic_rays),
                    'cosmic_ray_percentage': float(cosmic_ray_percentage),
                    'image_shape': data.shape,
                    'auto_tuned': auto_tune,
                    'parameters_used': {
                        'sigma_clip': self.sigma_clip,
                        'objlim': self.objlim,
                        'niter': self.niter,
                        'sigma_frac': self.sigma_frac
                    }
                }
                
                if method == 'multi':
                    results[fits_path]['multi_stats'] = multi_stats
                
                # Restore original parameters if auto-tuned
                if auto_tune:
                    for param, value in original_params.items():
                        setattr(self, param, value)
                
                # Call progress callback if provided
                if progress_callback:
                    progress_callback(i + 1, len(fits_paths), fits_path)
                
            except Exception as e:
                logger.error(f"Failed to process {fits_path}: {str(e)}")
                results[fits_path] = {
                    'success': False,
                    'error': str(e)
                }
        
        logger.info(f"Batch processing completed. Successful: {sum(1 for r in results.values() if r.get('success'))}/{len(fits_paths)}")
        
        return results

    def get_image_quality_metrics(self, data: np.ndarray) -> Dict[str, float]:
        """
        Calculate image quality metrics to help with parameter selection.
        
        Parameters:
        -----------
        data : np.ndarray
            Input image data
            
        Returns:
        --------
        metrics : dict
            Dictionary of image quality metrics
        """
        # Basic statistics
        mean_val = float(np.mean(data))
        median_val = float(np.median(data))
        std_val = float(np.std(data))
        mad_val = float(np.median(np.abs(data - median_val)))
        
        # Noise estimation
        noise_level = 1.4826 * mad_val
        snr = mean_val / noise_level if noise_level > 0 else 1.0
        
        # Dynamic range
        min_val = float(np.min(data))
        max_val = float(np.max(data))
        dynamic_range = max_val - min_val
        
        # Estimate star density (rough approximation)
        threshold = median_val + 3 * std_val
        star_pixels = np.sum(data > threshold)
        star_density = star_pixels / data.size
        
        return {
            'mean': mean_val,
            'median': median_val,
            'std': std_val,
            'mad': mad_val,
            'noise_level': float(noise_level),
            'snr': float(snr),
            'min': min_val,
            'max': max_val,
            'dynamic_range': float(dynamic_range),
            'star_density': float(star_density)
        }


def detect_cosmic_rays_simple(data: np.ndarray, 
                            sigma_threshold: float = 5.0,
                            gain: float = 1.0,
                            readnoise: float = 6.5) -> Tuple[np.ndarray, np.ndarray]:
    """
    Simple cosmic ray detection function for quick processing.
    
    Parameters:
    -----------
    data : np.ndarray
        Input image data
    sigma_threshold : float
        Sigma threshold for detection (default: 5.0)
    gain : float
        CCD gain in electrons/ADU (default: 1.0)
    readnoise : float
        CCD readout noise in electrons (default: 6.5)
        
    Returns:
    --------
    cleaned_data : np.ndarray
        Image with cosmic rays removed
    crmask : np.ndarray
        Mask of detected cosmic rays (True = cosmic ray)
    """
    detector = CosmicRayDetector(
        sigma_clip=sigma_threshold,
        gain=gain,
        readnoise=readnoise
    )
    
    return detector.detect_lacosmic(data)


def validate_cosmic_ray_parameters(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and sanitize cosmic ray detection parameters.
    
    Parameters:
    -----------
    params : dict
        Input parameters dictionary
        
    Returns:
    --------
    validated_params : dict
        Validated parameters with defaults applied
    """
    defaults = {
        'sigma_clip': 4.5,
        'sigma_frac': 0.3,
        'objlim': 5.0,
        'gain': 1.0,
        'readnoise': 6.5,
        'satlevel': 65535.0,
        'niter': 4,
        'method': 'lacosmic',
        'save_mask': True
    }
    
    validated = defaults.copy()
    
    for key, value in params.items():
        if key in defaults:
            if key in ['sigma_clip', 'sigma_frac', 'objlim', 'gain', 'readnoise', 'satlevel']:
                validated[key] = float(value)
            elif key in ['niter']:
                validated[key] = int(value)
            elif key in ['save_mask']:
                validated[key] = bool(value)
            elif key == 'method':
                if value in ['lacosmic', 'sigma_clip']:
                    validated[key] = value
                else:
                    logger.warning(f"Unknown method {value}, using default 'lacosmic'")
    
    return validated 