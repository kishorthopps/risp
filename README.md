docker build -t nallahealth-frontend .
docker run -p 3000:3000 nallahealth-frontend




docker tag nallahealth-frontend kishorthopps/nallahealth-frontend:latest
docker push kishorthopps/nallahealth-frontend:latest
docker pull kishorthopps/nallahealth-frontend:latest
docker run -d -p 3000:3000 --name nallahealth-frontend kishorthopps/nallahealth-frontend
