
import * as vscode from 'vscode';
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");

function compile(code: any, fileName: String, na: String, ds: String, sparePath?: String) {
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
            (element.elements || []).forEach((node: any) => {
              if (!find) {
                modpath = node.arguments[0].value.split('@/pages')[1]
                const file = fs.readFileSync(vscode.workspace.rootPath + '/src/pages' + modpath + '.ts', 'utf-8');
                file.split('\n').find((currentValue: any) => {
                  if (currentValue.indexOf("namespace: '" + na + "'") >= 0) {
                    find = true
                    return true
                  }
                })
              }
            });
            if (find) {
              modpath = vscode.workspace.rootPath + '/src/pages' + modpath + '.ts';
              vscode.workspace.openTextDocument(modpath).then((document) => {
                const texts = document.getText().split('\n');
                texts.forEach((s: any, index: any) => {
                  if (s.indexOf(ds+'(') >= 0) {
                    const range = new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index + 1, 0));
                    vscode.window.showTextDocument(document, {
                      selection: range,
                    });
                  }
                });
              })
            }
          }
        });
        return;
      }
    }
  };

  traverse.default(ast, visitor);

  return find
}

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('tomos.toMo', () => {
    const rootPath = vscode.workspace.rootPath + '/src/config/routers.knowledgePay.ts';
    const file = fs.readFileSync(rootPath, 'utf-8');
    let fileName = vscode.window.activeTextEditor?.document.fileName;
    if (!fileName) {
      return
    }
    if (fileName.split('pages/') && fileName.split('pages/')[1]) {
      fileName = fileName.split('pages/')[1]
    }
    if (fileName.indexOf('index.tsx') != -1) {
      fileName = fileName.split('/index.tsx')[0]
    } else {
      fileName = fileName.split('.tsx')[0]
    }
    fileName = "@/pages/" + fileName
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    const selection = editor?.selection;
    const text = document?.getText(selection);
    if (!text) {
      return
    }
    const arr = text.split('/');
    const na = arr[0].indexOf("'") >= 0 ? arr[0].split("'")[1] : arr[0];
    const ds = arr[1].indexOf("'") >= 0 ? arr[1].split("'")[0] : arr[1];
    const find = compile(file, fileName, na, ds)
    if (!find) {
      const finds = compile(file, fileName, na, ds, '@/pages/KnowledgePay/Root')
      if(!finds){
        vscode.window.showWarningMessage('models文件未能成功定位，请手动查找');
      }
    }
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
