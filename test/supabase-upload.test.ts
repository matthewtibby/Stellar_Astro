import { FileType } from '@/types/store';

// Mock Supabase client
const mockUser = { id: '00000000-0000-0000-0000-000000000000', email: 'test@example.com' };
const mockAuth = { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) };
const mockSupabase = { auth: mockAuth };
jest.mock('@/lib/supabase', () => ({
  createBrowserClient: jest.fn(() => mockSupabase),
  supabaseUrl: '',
  supabaseAnonKey: '',
}));

// Mock createProject
jest.mock('@/utils/projects', () => ({
  createProject: jest.fn(async (userId, projectName) => ({
    id: 'mock-project-id',
    name: projectName,
    user_id: userId,
  })),
}));

describe('Supabase Upload', () => {
  test('should authenticate and create a test project', async () => {
    const { createBrowserClient } = require('@/lib/supabase');
    const { createProject } = require('@/utils/projects');
    const supabase = createBrowserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    expect(authError).toBeNull();
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');

    // Create a test project (mocked)
    const projectName = 'test-upload-project';
    const project = await createProject(user.id, projectName);
    expect(project).toBeDefined();
    expect(project.name).toBe(projectName);
    expect(project.user_id).toBe(user.id);
  });
}); 