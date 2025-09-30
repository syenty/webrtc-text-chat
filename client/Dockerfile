# 1. 베이스 이미지 선택
FROM node:20-alpine

# 2. 컨테이너 내 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. 의존성 설치
COPY package*.json ./
RUN npm install

# 4. 소스 코드 복사
COPY . .

# 5. Vite 개발 서버가 사용하는 포트 노출
EXPOSE 8080

# 6. 컨테이너 실행 시 실행할 명령어
# Vite가 컨테이너 외부(호스트)에서도 접근 가능하도록 --host 0.0.0.0 옵션을 추가합니다.
# --port 5173은 docker-compose.yml에 설정된 포트와 맞춥니다.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]