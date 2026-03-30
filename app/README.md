# Express TypeScript Application

This folder contains a simple Express.js + TypeScript application.  
It includes a full Docker-based local development environment and a GitHub Actions CI pipeline.  
All application-related files (source code, Dockerfile, docker-compose, workflows, and documentation) are intentionally contained inside the `app/` folder as required.

---

## 📁 Folder Structure

```
app/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.json
├── src/
│   ├── app.ts
│   ├── routes/
│   │   └── index.ts
│   └── server.ts
└── .github/
    └── workflows/
        └── ci.yml
```

---

## 🚀 Local Development Setup

This project runs entirely inside Docker.  
You **do not** need Node.js or npm installed locally.

### Start the application

```bash
docker compose up
```

This will:

- Build the Docker image using the Dockerfile  
- Install dependencies inside the container  
- Run the app in development mode using `ts-node-dev`  
- Enable hot reload when editing files in `src/`  

The API will be available at:

```
http://localhost:3000
```

### Stop the application

```bash
docker compose down
```

---

## 🐳 Dockerfile Overview

The Dockerfile provides a development-friendly Node.js environment:

- Uses Node 18 Alpine  
- Installs dependencies from `package.json`  
- Copies the application source  
- Exposes port `3000`  
- Runs the app using the `npm run dev` script  

This ensures a consistent, reproducible environment for all developers.

---

## 🧪 Running Tests

If tests are added later, they can be executed inside the running container:

```bash
docker compose exec api npm test
```

---

## 🔄 CI Pipeline (GitHub Actions)

The CI workflow is located at:

```
app/.github/workflows/ci.yml
```

### Pipeline Triggers

The pipeline runs automatically on:

- Pushes to `main`
- Pull requests targeting `main`

### Pipeline Steps

1. **Checkout repository**  
2. **Set up Node.js (v18)**  
3. **Install dependencies (`npm install`)**  
4. **TypeScript compile check (`tsc --noEmit`)**  
5. **Build Docker image using the Dockerfile in `app/`**  

---

## 🧰 Useful Commands

### Rebuild the image

```bash
docker compose build
```

