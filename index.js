const {
  app,
  BrowserWindow,
  MenuItem,
  ipcMain,
  Tray,
  Menu,
} = require("electron");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const url = require("url");
const iconPath = path.join(__dirname, "/public/image/logo_smb.png");
const MenuTray = require("electron").Menu;
const { application } = require("electron");
const { autoUpdater } = require("electron-updater");

// process.env.NODE_ENV = "production";

let mainTray;
let mainWindow;
let addWindow;
let menuApplication = new Menu();

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 1000,
    minHeight: 700,
    title: "Task Application",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file",
      slashes: true,
    })
  );

  menuApplication = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menuApplication);

  mainWindow.once("ready-to-show", () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
};

let menuTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Add a new task",
        click() {
          createAddWindow();
        },
      },
      {
        label: "Exit",
        accelerator: process.platform == "darwin" ? "Command+Q" : "Control+Q",
        click() {
          app.quit();
        },
      },
    ],
  },
];

if (process.env.NODE_ENV !== "production") {
  menuTemplate.push({
    label: "Developer Tools",
    submenu: [
      {
        label: "Toggle DevTools",
        accelerator: process.platform == "darwin" ? "Command+I" : "Control+I",
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        },
      },
    ],
  });
}

// create Add task Window
const createAddWindow = () => {
  addWindow = new BrowserWindow({
    width: 300,
    height: 200,
    title: "Add Task",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  addWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "create.html"),
      protocol: "file",
      slashes: true,
    })
  );
};

ipcMain.on("task-add", async (event, args) => {
  createAddWindow();
});

ipcMain.on("submit-task", async (event, args) => {
  const taskName = args;
  const taskID = uuidv4();
  const data = {
    taskName,
    taskID,
  };
  mainWindow.webContents.send("submit-task", data);
  addWindow.close();
});

app.whenReady().then(() => {
  createMainWindow();
  mainWindow.hide();
  createTray();
});

// Xử lý sau khi Window được đóng
app.on("window-all-closed", () => {
  app.quit();
});

// Xử lý khi app ở trạng thái active, ví dụ click vào icon
app.on("activate", () => {
  // Mở window mới khi không có window nào
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// process
const reviewProcess = () => {
  console.log("--------");
  console.log(process.getCPUUsage().percentCPUUsage * 100);
  console.log("--------");
  console.log(process.getSystemMemoryInfo());
  console.log("--------");
  console.log(process.getSystemVersion());
};

// Tray
const createTray = () => {
  mainTray = Tray(iconPath);
  let menuTemplate = [
    {
      label: "Open",
      click() {
        mainWindow.show();
      },
    },
    {
      label: "Hidden",
      click() {
        mainWindow.hide();
      },
    },
    {
      label: "Exit",
      click() {
        app.quit();
      },
    },
  ];

  const ctxMenu = MenuTray.buildFromTemplate(menuTemplate);
  mainTray.setContextMenu(ctxMenu);
  mainTray.setToolTip("Task Manager Application");
};

// auto updater

autoUpdater.on("update-available", () => {
  mainWindow.webContents.send("update_available");
});
autoUpdater.on("update-downloaded", () => {
  mainWindow.webContents.send("update_downloaded");
});
