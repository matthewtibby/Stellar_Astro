from setuptools import setup, find_packages

setup(
    name="python-worker",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.109.2",
        "uvicorn==0.27.1",
        "python-multipart==0.0.9",
        "astropy==6.0.0",
        "pillow==10.2.0",
        "sep==1.2.1",
        "numpy==1.26.4",
        "scipy==1.12.0",
        "python-dotenv==1.0.1",
        "pydantic==2.6.1",
        "asyncpg==0.29.0"
    ],
) 