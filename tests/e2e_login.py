import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/usr/bin/google-chrome",
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append("PAGEERROR: " + str(e)))
        page.on("console", lambda m: errors.append(f"CONSOLE[{m.type}]: {m.text}"))

        # --- Login ---
        page.goto(f"{BASE}/auth", wait_until="domcontentloaded")
        page.wait_for_selector('[data-testid="login-usuario-input"]', timeout=30000, state="visible")
        print("PASS: login form visible")
        page.fill('[data-testid="login-usuario-input"]', "flow")
        page.fill('[data-testid="login-pin-input"]', "9999")
        page.click('[data-testid="login-submit-button"]')
        # after login should navigate to dashboard "/"
        try:
            page.wait_for_url(f"{BASE}/", timeout=15000)
        except Exception:
            pass
        page.wait_for_timeout(3000)
        print("URL after login:", page.url)

        # localStorage session set?
        sess = page.evaluate("() => window.localStorage.getItem('printflow:operador')")
        print("SESSION:", sess)

        # admin should see the sidebar (Operadores link) — navigate to /usuarios
        page.goto(f"{BASE}/usuarios", wait_until="domcontentloaded")
        try:
            page.wait_for_selector('[data-testid="novo-operador-button"]', timeout=20000, state="visible")
            print("PASS: admin can access Operadores panel")
        except Exception as e:
            print("FAIL: operadores panel not visible:", e)
        # operator row for flow present?
        page.wait_for_timeout(1500)
        has_flow = page.evaluate("() => !!document.querySelector('[data-testid=\\'operador-row-flow\\']')")
        print("flow row present:", has_flow)
        body = page.evaluate("() => document.body.innerText")
        print("USUARIOS BODY (first 300):", body[:300].replace("\n", " | "))

        # --- Logout via clearing? test guard: remove session and hit protected route ---
        page.evaluate("() => window.localStorage.removeItem('printflow:operador')")
        page.goto(f"{BASE}/pdv", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        print("URL after removing session and visiting /pdv:", page.url)

        print("---- console/pageerrors ----")
        for e in errors[:30]:
            if "PAGEERROR" in e or "error" in e.lower():
                print(e)
        browser.close()


if __name__ == "__main__":
    run()
