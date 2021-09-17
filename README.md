# auto-quizlet-gravity

自動で Quizlet の**グラビティ**を実行します。
他のゲームには対応してません。
PC が重くなければ大体 100 万点前後でます。
縦長デバイスを使ったらもっと得点が出るかも...?

# 必要なもの

-   npm
-   node

# 使い方

まずは

```zsh
npm install
```

してください。

次に、`test.js`を次のように作成します

```js:test.js
const main = require("./main")

// テスト
async function test() {
    await main.doGravity("https://quizlet.com/xxxxx00/gravity", "UserName", "Password", false)
}

test()

```

`false`は、ヘッドレスモード(実際にブラウザを表示するか否か)を指定しています。
`false`なら表示します。`true`なら表示しません。

他のパラメーターはそれぞれ自分の、「グラビティの URL」、「ユーザーネーム」、「パスワード」を入れてください。
次に、以下を実行して完了です。

```zsh
node test.js
```

ブラウザが立ち上がり、グラビティが開始されます。

もしログインしたくなければ、`main.js`の

```js
await login(username, password, page)
```

をコメントアウトしてください。
