import { NextRequest, NextResponse } from 'next/server';

const PYTHON_WORKER_URL = process.env.NEXT_PUBLIC_PYTHON_WORKER_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const expectedType = formData.get('expectedType') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Forward the request to the Python worker
    const response = await fetch(`${PYTHON_WORKER_URL}/validate-fits`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Validation failed' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating FITS file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 