
# How to Set Up a New Computer to Clone a GitHub Repository  
_Applies to factory installations of macOS, Windows, and Linux._

The **only** tool you need to clone a GitHub repo is **Git**. Below is exactly how to install it on each operating system and clone a repository.

---

## ✅ macOS

### 1. Install Git  
Option A – using the built-in prompt:
```bash
git --version
```

* A dialog will appear asking to install **Command Line Tools**.
* Accept and complete the installation.

Option B – using Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git
```

### 2. Clone the repository

```bash
git clone <repo-url>
```

---

## ✅ Windows

### 1. Install Git for Windows

Download and install from:
[https://git-scm.com/download/win](https://git-scm.com/download/win)

* Run the installer
* Accept default settings

### 2. Clone the repository

In **Git Bash** or **Command Prompt**:

```bash
git clone <repo-url>
```

---

## ✅ Linux

### 1. Install Git using your package manager

**Debian / Ubuntu / Linux Mint**

```bash
sudo apt update
sudo apt install git
```

**Fedora**

```bash
sudo dnf install git
```

**Arch / Manjaro**

```bash
sudo pacman -S git
```

### 2. Clone the repository

```bash
git clone <repo-url>
```

---

## ✅ Quick Reference

| OS      | What to Install | How to Install                                | Clone Command          |
| ------- | --------------- | --------------------------------------------- | ---------------------- |
| macOS   | Git             | `git --version` → install prompt, or Homebrew | `git clone <repo-url>` |
| Windows | Git for Windows | Download installer from git-scm.com           | `git clone <repo-url>` |
| Linux   | Git             | Package manager (`apt`, `dnf`, `pacman`)      | `git clone <repo-url>` |

No GitHub account, SSH keys, or extra tools are needed unless authentication is required.

```
```
