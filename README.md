# Trividuel

trivia dueling webgame on a 1v1 setting. Python fastapi backend and React.js frontend. We want to create an online game where people can learn whilst adding a bit of competitive spice.

>_**Our Mission**: to create an online that encourages curiosity and learning of science, technology, cultures, geography._


Private repository as of now.

![Game screenshot](./assets/images/game_screenshot.png)
![VS Screen screenshot](./assets/images/vsscreen.png)

# Backend 

## Backend Set Up

```bash
# create venv
cd backend/
python3 -m venv venv 
pip install poetry
poetry install --no-root
```

to start:
```bash
cd backend/     # if you haven't already
source venv/bin/activate

bash scripts/start.sh
```
Or alternatively, to start a test environment and use the testers tokens
```bash
bash scripts/start.sh --test
```
The testers token for websocket as below: <br>
`1234567890 -> {"uid": "1234567890", "name": "Tester"}` <br>
`0987654321 -> {"uid": "0987654321", "name": "Tester"}`<br>
insert these tokens in the query eg `/me?token=1234567890` to test as a Tester.

## Backend Concepts - ELO

### How it Behaves

| Scenario                   | Winner’s Change | Loser’s Change | Net Change             |
|----------------------------|-----------------|----------------|------------------------|
| Low (600) beats High (1800) | +42            | −35           | +7 (ratings drift upward) |
| High (1800) beats Low (600) | +29            | −35           | −6 (ratings drift downward) |
| Both at mean (1500)         | +16            | −16           | 0 (classic Elo)        |

*(Numbers assume k=32, alpha=0.5, min_k=16, max_k=64.)*

---

### Tuning Tips

| Knob       | Effect                                                                 |
|------------|------------------------------------------------------------------------|
| mean_elo   | Moves the “center of gravity”.                                         |
| alpha      | 0 → classic Elo; 0.3–0.6 is common; >1 gets very aggressive.           |
| min_k, max_k | Prevent absurd jumps for brand-new or very extreme ratings.          |

---

Because the winner’s and loser’s K-factors differ, the system injects (or removes) a few points each game, nudging everyone toward the mean. New players starting at 1200 will, on average, climb even with a 50% win rate, while long-time high-rated players will feel more pressure to keep performing well.

## Backend Development - Linting

```bash
poetry install --with dev
sh scripts/lint.sh
```
## Backend Development - Testing
```bash
sh scripts/test.sh <optinonal_path>
```
If everything set up correctly, the test should all pass.


# Frontend

## Backend Set Up

set up:
```bash
cd frontend/
npm i
```
cause its using vite:
```bash
cd frontend/    # if you haven't already
npm run dev
```

## Frontend Development

all css should be in `styles/`

## Frontend Development - Linting

To maintain a consistent code style and ensure code quality across the project, we use **Prettier** for automatic formatting and **ESLint** for linting.

### Prettier (VSCode Extension)

1. Install the **Prettier - Code Formatter** extension in VSCode:
   - Go to the Extensions Marketplace (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac) and search for "Prettier".
   - Install the extension.

2. Enable Prettier as the default formatter:
   - Open the VSCode settings (`Ctrl+,` or `Cmd+,` on Mac).
   - Search for `default formatter` and set it to `"Prettier - Code Formatter"`.
   - Enable format on save by searching for `editor.formatOnSave` and toggling it on.

3. Prettier will now automatically format your code whenever you save a file, ensuring a consistent style.


### ESLint (via `npm run lint`)

ESLint is used to identify and fix potential issues in your codebase.

1. **To Run ESLint**:
```bash
npm run lint
```

2. **To Automatically Fix Issues**:
```bash
npm run lint -- --fix
```


### Best Practices

- Use **Prettier** for formatting and **ESLint** for linting—they complement each other.
- Run `npm run lint` regularly to catch issues early.
- Consider using a VSCode ESLint extension for real-time linting feedback while coding.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh




# Data Prep

This folder is a jupyter notebook environment for preparing and consolidating trividuel questions.

`data_prep/question_preparation.ipynb`

All CSVs in `chosen/` are used to create the final dataset for backend. `arhive/` stores the others datasets that are not chosen.

We encourage datasets rich with knowledge diversity and explores in science, mathematics, general knowledge, geography, culture and religion around the globe.

The dataset should not be limited to one specific culture and domain.

# Contribution

request Reagan Chan <rrr.chanhiulok@gmail.com> for more info