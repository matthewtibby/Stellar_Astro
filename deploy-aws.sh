#!/bin/bash

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "Elastic Beanstalk CLI is not installed. Please install it first."
    echo "Run: pip install awsebcli"
    exit 1
fi

# Create a zip file of the Python worker
echo "Creating deployment package..."
cd python-worker
zip -r ../deployment.zip .
cd ..

# Initialize EB if not already done
if [ ! -f ".elasticbeanstalk/config.yml" ]; then
    echo "Initializing Elastic Beanstalk application..."
    eb init -p python-3.9 stellar-astro-worker --region eu-west-2
fi

# Create or update the environment
echo "Deploying to Elastic Beanstalk..."
eb deploy stellar-astro-worker-env

echo "Deployment complete! Check your AWS Elastic Beanstalk console for status."

curl http://stellar-astro-env.eba-ymkmkjmx.us-east-1.elasticbeanstalk.com/ 