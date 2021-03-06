
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as parser from '@babel/parser';
import * as traverse from '@babel/traverse';

function compile(code: string, url: String) {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript"]
  });
  let find = false
  const visitor = {
    Identifier(path: any) {
      if (path.node.name === 'path' && path.parent.value.value === url) {
        const parent = path.findParent((path: any) => path.isObjectExpression());
        const component = (parent.node.properties || []).find((s: any) => s.key.name === 'component')
        const expression = (component.value.arguments || []).find((s: any) => s.type === 'ArrowFunctionExpression')
        const comPath = expression.body.arguments[0].value
        if(comPath){
          vscode.workspace.findFiles('tsconfig.json', '**​/node_modules/**', 1).then(s=>{
            if(s){
              const tsconfig = fs.readFileSync(s[0].path, 'utf-8')
              const alisePath = JSON.parse(tsconfig).compilerOptions.paths['@/*'][0]
              let comPaths = vscode.workspace.rootPath + alisePath.substr(1, alisePath.length-3) + comPath.substr(1)
              if(fs.existsSync(comPaths + '/index.tsx')){
                comPaths = comPaths + '/index.tsx'
                find = true
              }else if(fs.existsSync(comPaths + '.tsx')){
                comPaths = comPaths + '.tsx'
                find = true
              }
              if(find){
                vscode.workspace.openTextDocument(comPaths).then((document) => {
                  const texts = document.getText().split('\n');
                  let index = texts.findIndex((s: any, i: any) => s.indexOf('export default') >= 0)
                  if (index === -1) {
                    index = 0
                  }
                  const range = new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index + 1, 0));
                  vscode.window.showTextDocument(document, {
                    selection: range,
                  });
                })
              }else{
                vscode.window.showWarningMessage('页面文件未能成功定位，请手动查找');
              }
            }
          })
        }
      }
    }
  };

  traverse.default(ast, visitor);

  return find
}

export function activate(context: vscode.ExtensionContext) {

  let disposable_toMo = vscode.commands.registerCommand('tomos.toMo', () => {
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    const selection = editor?.selection;
    const text = document?.getText(selection);
    const arr = text!.split('/');
    const na = arr[0].indexOf("'") >= 0 ? arr[0].split("'")[1] : arr[0];
    const ds = arr[1].indexOf("'") >= 0 ? arr[1].split("'")[0] : arr[1];
    vscode.workspace.findTextInFiles({ pattern: "namespace: " + "'" + na + "'" }, (s: vscode.TextSearchResult) => {
      if (s.uri) {
        vscode.workspace.openTextDocument(s.uri).then((document) => {
          const texts = document.getText().split('\n');
          let index = texts.findIndex((s: any, i: any) => s.indexOf(ds + '(') >= 0)
          if (index === -1) {
            index = 0
            vscode.window.showWarningMessage('effects或者reducers未能成功定位，请手动定位');
          }
          const range = new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index + 1, 0));
          vscode.window.showTextDocument(document, {
            selection: range,
          });
        })
      } else {
        vscode.window.showWarningMessage('models文件未能成功定位，请手动查找');
      }
    })
  });

  let disposable_toPage = vscode.commands.registerCommand('tomos.toPage', async () => {
    let url = await vscode.window.showInputBox({ placeHolder: '请输入页面url' });
    if (!url) {
      vscode.window.showWarningMessage('url不能为空');
      return;
    }
    url = "/" + url;
    vscode.workspace.findTextInFiles({ pattern: " path: '" + url + "'"}, (s: vscode.TextSearchResult) => {
      if (s.uri) {
        const code = fs.readFileSync(s.uri.fsPath, 'utf-8')
        compile(code, url!)
      }
    })
  });


  context.subscriptions.push(disposable_toMo);
  context.subscriptions.push(disposable_toPage);
}

// this method is called when your extension is deactivated
export function deactivate() { }
