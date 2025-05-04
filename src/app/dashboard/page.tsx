import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const DashboardPage = () => {
  const router = useRouter();

  const handleNewProject = async () => {
    try {
      setIsSavingProjectName(true);
      const supabase = getSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Authentication required');
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          title: 'Untitled Project',
          description: '',
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: false
        }])
        .select()
        .single();
      if (projectError) throw new Error(projectError?.message || 'Failed to create project');
      
      // Navigate to the project's upload workflow
      router.push(`/dashboard/${project.id}?step=upload`);
      
      setActiveProject({
        id: project.id,
        name: project.title,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
        status: 'draft',
        target: { id: '', name: '', catalogIds: [], constellation: '', category: 'other', type: 'other', commonNames: [], coordinates: { ra: '', dec: '' } },
        steps: []
      });
      setProjectNameEdit(project.title);
      setCurrentStep(0);
      setShowNewProject(false);
      await fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      // Optionally show error to user
    } finally {
      setIsSavingProjectName(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        <button
          onClick={handleNewProject}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Project
        </button>
      </div>
    </div>
  );
};

export default DashboardPage; 

function setIsSavingProjectName(arg0: boolean) {
    throw new Error('Function not implemented.');
}


function setActiveProject(arg0: { id: any; name: any; createdAt: Date; updatedAt: Date; status: string; target: { id: string; name: string; catalogIds: never[]; constellation: string; category: string; type: string; commonNames: never[]; coordinates: { ra: string; dec: string; }; }; steps: never[]; }) {
    throw new Error('Function not implemented.');
}


function setProjectNameEdit(title: any) {
    throw new Error('Function not implemented.');
}


function setCurrentStep(arg0: number) {
    throw new Error('Function not implemented.');
}


function setShowNewProject(arg0: boolean) {
    throw new Error('Function not implemented.');
}


function fetchProjects() {
    throw new Error('Function not implemented.');
}
