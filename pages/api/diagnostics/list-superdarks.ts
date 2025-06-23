import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

// This is a diagnostic endpoint and should be used carefully.
// It uses service_role key to bypass RLS.
// Ensure your environment variables are set correctly on the server.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // List all files in the superdarks bucket (recursive view)
    console.log(`[API Diagnostics] Listing entire superdarks bucket structure...`);

    // First, list root level to see if there are any files in wrong location
    const { data: rootData, error: rootError } = await supabaseAdmin.storage
      .from('superdarks')
      .list('', {
        limit: 1000,
        offset: 0,
      });

    if (rootError) {
      console.error('[API Diagnostics] Supabase admin storage error:', rootError);
      return res.status(500).json({ error: rootError.message, details: rootError });
    }

    // Separate files from folders
    const rootFiles = rootData?.filter(item => 
      (item.name.endsWith('.fits') || item.name.endsWith('.fit') || item.name.endsWith('.png'))
    ) || [];
    
    const userFolders = rootData?.filter(item => 
      !item.name.includes('.') && item.id === null
    ) || [];

    // Now check each user folder for proper project structure
    const folderContents: any[] = [];
    
    for (const userFolder of userFolders) {
      try {
        const { data: userFiles, error: userError } = await supabaseAdmin.storage
          .from('superdarks')
          .list(userFolder.name, { limit: 100 });
        
        if (!userError && userFiles) {
          // Check if files are directly in user folder (old structure) or in project subfolders (new structure)
          const directFiles = userFiles.filter(item => 
            (item.name.endsWith('.fits') || item.name.endsWith('.fit') || item.name.endsWith('.png'))
          );
          
          const projectFolders = userFiles.filter(item => 
            !item.name.includes('.') && item.id === null
          );

          folderContents.push({
            userId: userFolder.name,
            structure: {
              directFiles: directFiles.length,
              projectFolders: projectFolders.length,
              files: directFiles.map(f => f.name),
              projects: projectFolders.map(p => p.name)
            }
          });

          // If there are project folders, check their contents too
          for (const projectFolder of projectFolders) {
            try {
              const { data: projectFiles, error: projectError } = await supabaseAdmin.storage
                .from('superdarks')
                .list(`${userFolder.name}/${projectFolder.name}`, { limit: 100 });
              
              if (!projectError && projectFiles) {
                const projectSuperdarkFiles = projectFiles.filter(item => 
                  (item.name.endsWith('.fits') || item.name.endsWith('.fit') || item.name.endsWith('.png'))
                );
                
                folderContents.push({
                  userId: userFolder.name,
                  projectId: projectFolder.name,
                  structure: {
                    files: projectSuperdarkFiles.map(f => f.name),
                    fileCount: projectSuperdarkFiles.length
                  }
                });
              }
            } catch (e) {
              // Ignore individual project folder errors
            }
          }
        }
      } catch (e) {
        // Ignore individual user folder errors
      }
    }

    const summary = {
      totalRootFiles: rootFiles.length,
      totalUserFolders: userFolders.length,
      filesInWrongLocation: rootFiles.length,
      recommendation: rootFiles.length > 0 
        ? "Some files are in the root of the bucket. They should be moved to userId/projectId/ structure."
        : "Bucket structure looks correct."
    };

    console.log(`[API Diagnostics] Bucket analysis complete:`, summary);
    
    return res.status(200).json({
      summary,
      rootFiles: rootFiles.map(f => ({ name: f.name, size: f.metadata?.size, lastModified: f.updated_at })),
      folderStructure: folderContents
    });
  } catch (e: any) {
    console.error('[API Diagnostics] Server error:', e);
    return res.status(500).json({ error: 'Internal Server Error', details: e.message });
  }
} 