
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('tomos.toMo', () => {
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    const selection = editor?.selection;
    const text = document?.getText(selection);
    const arr = text!.split('/');
    const na = arr[0].indexOf("'") >= 0 ? arr[0].split("'")[1] : arr[0];
    const ds = arr[1].indexOf("'") >= 0 ? arr[1].split("'")[0] : arr[1];
    vscode.workspace.findTextInFiles({ pattern: "namespace: " + "'" + na + "'" }, (s: vscode.TextSearchResult) => {
      if(s.uri){
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
      }else{
        vscode.window.showWarningMessage('models文件未能成功定位，请手动查找');
      }
    })
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
