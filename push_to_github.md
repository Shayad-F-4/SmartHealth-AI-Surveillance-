# GitHub Push Automation Scripts

You can copy and paste the commands below into your terminal (PowerShell, Command Prompt, or Git Bash) to stage all changes, commit them with a detailed message, and push to your GitHub repository.

---

### Option 1: PowerShell Script (`push_to_github.ps1`)

Run this in PowerShell from the root directory (`c:\Users\userm\OneDrive\Desktop\MP`):

```powershell
git add .
git commit -m "feat(ui/robot): compact navbar/sidebar UI & 4-edge peeking 3D AI floating robot assistant"
git push
```

---

### Option 2: Command Prompt / Windows CMD (`push_to_github.cmd`)

Run this in Windows Command Prompt:

```cmd
git add . && git commit -m "feat(ui/robot): compact navbar/sidebar UI & 4-edge peeking 3D AI floating robot assistant" && git push
```

---

### Option 3: Git Bash Script (`push_to_github.sh`)

Run this in Git Bash:

```bash
#!/usr/bin/env bash
git add .
git commit -m "feat(ui/robot): compact navbar/sidebar UI & 4-edge peeking 3D AI floating robot assistant"
git push
```
