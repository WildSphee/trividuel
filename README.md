# Trividuel

trivia dueling webgame on a 1v1 setting. Python fastapi backend and React.js frontend
Private repo

# Backend 

## Set Up

```bash
# create venv
python3 -m venv venv 
pip install poetry
poetry install --no-root
```

to start:
```bash
cd backend/
source venv/bin/activate

bash scripts/start.sh
```
Or alternatively, to start a test environment and use the testers tokens
```bash
bash scripts/start.sh --test
```

## Development - Linting

```bash
poetry install --with dev
sh scripts/lint.sh
```
## Development - Testing
```bash
sh scripts/test.sh <optinonal_path>
```


# Frontend

## Set Up

set up:
```bash
npm i
```
cause its using vite:
```bash
npm run dev
```

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


# Contribution

request reagan chan <rrr.chanhiulok@gmail.com> for more info