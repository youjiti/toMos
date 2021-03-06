
import * as vscode from 'vscode';
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");

function compile(code: any, fileName: String, na: String, ds: String, sparePath?: String, flag?: Boolean) {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript"]
  });
  let find = false
  const visitor = {
    StringLiteral(path: any) {
      if (path.node.value === (sparePath || fileName)) {
        const parent = path.findParent((path: any) => path.isArrowFunctionExpression());
        (parent.parent.arguments || []).forEach((element: any) => {
          if (element.type === 'ArrayExpression') {
            let modpath: any
            let p
            for (let node of (element.elements || [])) {
              if (!find) {
                modpath = node.arguments[0].value.split('@/pages')[1]
                p = vscode.workspace.rootPath + '/src/pages' + modpath + '.ts'
                const exists = fs.existsSync(p)
                if (!exists) {
                  p = vscode.workspace.rootPath + '/src/pages' + modpath + '/index.ts'
                }
                const file = fs.readFileSync(p, 'utf-8');
                file.split('\n').find((currentValue: any) => {
                  if (currentValue.indexOf("namespace: '" + na + "'") >= 0) {
                    find = true
                    return true
                  }
                })
              }
            }
            if (find) {
              modpath = p;
              vscode.workspace.openTextDocument(modpath).then((document) => {
                const texts = document.getText().split('\n');
                let index = texts.findIndex((s: any, i: any) => s.indexOf(ds + '(') >= 0)
                if(index === -1){
                  index = 0
                  vscode.window.showWarningMessage('effects或者reducers未能成功定位，请手动查找');
                }
                const range = new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index + 1, 0));
                vscode.window.showTextDocument(document, {
                  selection: range,
                });
              })
            } else if (flag) {
              vscode.window.showWarningMessage('models文件未能成功定位，请手动查找');
            }
          }
        });
        return find;
      }
    }
  };

  traverse.default(ast, visitor);

  return find
}

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('tomos.toMo', () => {
    // const rootPath = vscode.workspace.rootPath + '/src/config/routers.knowledgePay.ts';
    // const file = fs.readFileSync(rootPath, 'utf-8');
    // let fileName = vscode.window.activeTextEditor?.document.fileName;
    // if (!fileName) {
    //   return
    // }
    // if (fileName.split('pages/') && fileName.split('pages/')[1]) {
    //   fileName = fileName.split('pages/')[1]
    // }
    // if (fileName.indexOf('index.tsx') != -1) {
    //   fileName = fileName.split('/index.tsx')[0]
    // } else {
    //   fileName = fileName.split('.tsx')[0]
    // }
    // fileName = "@/pages/" + fileName
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    const selection = editor?.selection;
    const text = document?.getText(selection);
    const arr = text!.split('/');
    const na = arr[0].indexOf("'") >= 0 ? arr[0].split("'")[1] : arr[0];
    const ds = arr[1].indexOf("'") >= 0 ? arr[1].split("'")[0] : arr[1];
    vscode.workspace.findTextInFiles({ pattern: "namespace: " + "'" + na + "'" }, (s: any, m: any) => {
      if(s.uri){
        vscode.workspace.openTextDocument(s.uri).then((document) => {
          const texts = document.getText().split('\n');
          let index = texts.findIndex((s: any, i: any) => s.indexOf(ds + '(') >= 0)
          if (index === -1) {
            index = 0
            vscode.window.showWarningMessage('effects或者reducers未能成功定位，请手动查找');
          }
          const range = new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index + 1, 0));
          vscode.window.showTextDocument(document, {
            selection: range,
          });
        })
      }else{
        vscode.window.showWarningMessage('models文件未能成功定位，请手动查找');
      }
    })

    // if (!compile(file, fileName, na, ds)) {
    //   if (!compile(file, fileName, na, ds, '@/pages/KnowledgePay/Root')) {
    //     compile(file, fileName, na, ds, '@/pages/KnowledgePay/' + fileName.split('KnowledgePay/')[1].split('/')[0], true)
    //   }
    // }
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
