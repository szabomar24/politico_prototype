
# How to Set Up a New Computer to Clone a GitHub Repository  

The **only** tool you need to clone a GitHub repo is **Git**. Below is exactly how to install it on each operating system and clone a repository.

## How to get the repo-url:
1. Navigate to the repository: https://github.com/szabomar24/politico_prototype
2. Click the green “Code” button
3. In “Local” select “HTTPS”, copy the URL

---

## macOS

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
```

Then run:
```bash
brew install git
```

### 2. Clone the repository

```bash
git clone <repo-url>
```

**Tip:** Don't include the <> in the command, just the URL.

---

## Windows

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

**Tip:** Don't include the <> in the command, just the URL.

---

## Linux

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

**Tip:** Don't include the <> in the command, just the URL.

---

No GitHub account, SSH keys, or extra tools are needed unless authentication is required.
