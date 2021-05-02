# Project Basic Build Test Status
[![](https://github.com/Louis-He/VisualMem/actions/workflows/windows_build.yml/badge.svg)]() [![](https://github.com/Louis-He/VisualMem/actions/workflows/mac_build.yml/badge.svg)]() [![](https://github.com/Louis-He/VisualMem/actions/workflows/linux_build.yml/badge.svg)]()

# How to Run the Project
## Run Under Development Setting
1. There is a file: `electron/main.js`. First change the `const debug = false;` to `const debug = true;`
2. In the project directory, you can run: `npm run react-start`. Keep the terminal window open. This will start ReactJs front service.
3. In the project directory, you can run: `npm run start`. The application should pop up and in development setting.

## Run Under Production Setting
1. In the project directory, you can run: `npm run build`. This step will package the code from ReactJs
2. In the project directory, you can run: `npm run package`. The application should be packaged by electron-forge. The output of the application will be available in a folder called `out/`

# Contribution Rule
1. Never push your rule directly into main. Get a branch, push your code, open a pull request and wait for Github Action to pass and others to approve your code.
2. Always set `const debug` to `false` when push your code change to the repository.

# Coding Style
1. Always use IPC from electron to communicate to the machine if you are in render processes. In render processes, if you want to communicate with main process, then function name should be always be in this format `ipcRenderer.invoke('requestXxxxx',)`. In main processes, if you want to communicate with renderer processes, then function name should be always be in this format `xxx.webContents.send('distributeXxxx',)`.