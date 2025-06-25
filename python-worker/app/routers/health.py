from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.get("/test")
async def test_endpoint():
    return {"status": "ok", "message": "Python worker is running"} 