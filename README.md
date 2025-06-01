# Trividuel

trivia dueling webgame on a 1v1 setting. Python fastapi backend and React.js frontend. We want to create an online game where people can learn whilst adding a bit of competitive spice.

>_**Our Mission**: to create an online that encourages curiosity and learning of science, technology, cultures, geography._


Private repository as of now.

![login screen screenshot](./assets/images/doc_login_screen.png)
![UI screenshot](./assets/images/doc_ui_screenshot.png)

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

# Deployment Learning
documentation of the deployment playbook <br>
**Ubuntu 22.04 + Nginx + Let’s Encrypt + FastAPI + React**

## 0 Sanity-check

| Item | Value |
|------|-------|
| Public IP | **xxx.xxx.xxx.xx** |
| Domains | **trividuel.io**, **www.trividuel.io** |
| Front-end | React / Vite dev server on **5173** *or* static **dist/** |
| Back-end | FastAPI on **5678** |

## 1 Build & Deploy the Front-end

1. SSH into the VM.
2. Inside the React repo run  
   ```bash  
   npm run build  
   sudo mkdir -p /var/www/trividuel.io  
   sudo rsync -av dist/ /var/www/trividuel.io/  
   ```

## 2 Install Nginx & Open Ports

```bash
sudo apt update && sudo apt install nginx -y
sudo ufw allow 'OpenSSH'
sudo ufw allow 'Nginx Full'     # 80 & 443
sudo ufw enable
```

## 3 Issue TLS Certificates

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# One-liner (–nginx plugin auto-edits vhost and sets up renewals)
sudo certbot --nginx -d trividuel.io -d www.trividuel.io
```

Choose **redirect** when prompted so HTTP auto-forwards to HTTPS.  
Certs live in */etc/letsencrypt/live/trividuel.io/*; renewals run twice a day via systemd-timer.

## 4 Create the Nginx Server Block

```bash
sudo nano /etc/nginx/sites-available/trividuel.io.conf
```
whole scripts below:
```py
# /etc/nginx/sites-available/trividuel.io.conf
server {
    listen 80;
    listen [::]:80;
    server_name trividuel.io www.trividuel.io;

    # Safety net if certbot fails temporarily
    location /.well-known/acme-challenge/ { root /var/www/html; }

    # Redirect everything to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name trividuel.io www.trividuel.io;

    # --- SSL bits auto-managed by Certbot ---
    ssl_certificate /etc/letsencrypt/live/trividuel.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trividuel.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # HSTS (adds one more layer of security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # --------------  FRONT-END  --------------
    root /var/www/trividuel.io;
    index index.html;

    # Try static first, then fall back to SPA entry point
    location / {
        try_files $uri $uri/ /index.html;
    }

    # --------------  BACK-END  --------------
    # Assumes your API listens on 127.0.0.1:5678
    location /api/ {
        proxy_pass         http://127.0.0.1:5678/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Optional: WebSocket support (if your API uses it)
    location /ws/ {
        proxy_pass http://127.0.0.1:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Gzip for static assets
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}
```

## 5 Deploying / Redeploying

Step 1 has already shown how to deploy the frontend.<br>
In case of any frontend changes, and you want to redeploy it, do this:<br> 
`sudo rsync -av --delete dist/ /var/www/trividuel.io/`<br>

for backend you will have to use either systemd to keep it running or for my case tmux. Cause I'm lazy

## 6 Deployment Scalability and Speed - Learnings

To optimize speed, remember for backend must serve without hot reload - minimize CPU usage
Backend utilize LRU for static unchanging data, like leadership scores. this also prevents multiple unnecessary expensive fetches to the DB. In the future, I could have planned the DB connection and usage more carefully, especially right now every login we fetch from the DB at least once. everytime the user changes the avatar - every call and socket connection calls the DB once. Which can be expensive. In future perhaps redis would be the answer, cached in mem and periodic sync with DB.

frontend, all images should be webp served via cloudflare CDN. This game its set up already.
If I were to rebuild this again I would've used flutter hands down. As cross platform is something I didn't consider in the beginning. As games are heavy mobile based. Code wise the game session is quite a mess, a lot of conflicting ideas and implementations. I should've cached every data I received throughout the game, so to reduce the payload side on exchange. The same applies heavily to the backend's GameSession Object. a lot of information I should cache and reuse throughout the game.

Overall I'm very pleased with the results. The server set up, infra, network wise was without hurdles. Frontend is not perfect but still very performant, backend I could've planned better for scalability with different questions and user parsing. But overall this achievement is nothing to be ashamed of.


# Contribution and Distribution

request Reagan Chan <rrr.chanhiulok@gmail.com> for more info