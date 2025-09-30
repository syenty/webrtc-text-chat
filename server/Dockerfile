# 1. 베이스 이미지 선택
# Alpine 버전은 이미지 크기가 작아 효율적입니다.
FROM node:20-alpine

# 2. 컨테이너 내 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. 의존성 설치
# package.json과 package-lock.json을 먼저 복사하여
# 소스 코드가 변경되어도 의존성을 다시 설치하지 않도록 캐싱을 활용합니다.
COPY package*.json ./
RUN npm install

# 4. 소스 코드 복사
# docker-compose에서 볼륨 마운트를 사용하므로, 이 단계는 초기 빌드 시에만 의미가 있습니다.
COPY . .

# 5. 컨테이너 실행 시 실행할 명령어
CMD ["npm", "run", "dev"]