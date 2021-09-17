var process = require("process")
// const dotenv = require("dotenv")
const puppeteer = require("puppeteer")

const wordList = {
    "問題 1": "答え1",
    "Question 2": "Answer 2",
    "左に問題を入れて、 ": "右に入力したい答えを入れます",
}

// ログインする
async function login(username, password, page) {
    // まずは移動
    await page.goto("https://quizlet.com/")

    await page.click(
        'button[class="AssemblyButtonBase AssemblyTextButton AssemblyTextButton--inverted AssemblyButtonBase--small"]'
    )

    // 諸情報入力
    await page.type("#username", username)
    await page.type("#password", password)

    // submitする
    await page.click('button[type="submit"]')
}

// グラビティをする
async function doGravity(url, username, password, headless = true) {
    console.log("start doGravity")

    const browser = await puppeteer.launch({
        headless: headless,
        args: [
            // "--no-sandbox",
            // "--disable-setuid-sandbox",
            // "--disable-gpu",
            // "--disable-dev-shm-usage",
            // "--no-first-run",
            // "--no-zygote",
            // "--single-process",
        ],
    })
    const page = await browser.newPage()
    // await page.setRequestInterception(true)
    // page.on("request", (request) => {
    //     if (["image", "stylesheet", "font"].indexOf(request.resourceType()) !== -1) {
    //         request.abort()
    //     } else {
    //         request.continue()
    //     }
    // })

    try {
        // まずはログイン(ログインしたくなければコメントアウトしてね)
        await login(username, password, page)

        // await page.waitForNavigation({ waitUntil: "domcontentloaded" })

        // グラビティのページに行く
        await page.goto(url)

        // ページのズームを切り替えるテスト(無視して)
        // await page.setViewport({
        //     width: 1280,
        //     height: 960,
        //     deviceScaleFactor: 4,
        // })

        // await page.waitForTimeout(999999)

        // ゲームを開始
        await page.click('button[class="UIButton UIButton--hero"]')

        // 種類選択
        await page.select("select.UIDropdown-select", "word")

        // 難易度選択
        await page.click('button[class="UIButton UIButton--fill UIButton--hero"]')

        // 赤い惑星に注意
        await page.click('button[class="UIButton UIButton--hero"]')

        var isFinished = false

        // 終了するまでずっと回す
        while (!isFinished) {
            // 惑星が降りてくるまで待つ
            await page.waitForSelector('span[class="TermText notranslate lang-en"]', { timeout: 10000 })

            // 発見したら全て見つけて中身からテキストを生成
            const questions = await page.$$eval('span[class="TermText notranslate lang-en"]', (options) => {
                return options.map((option) => option.textContent)
            })

            // もしここで失敗したら死んでるので終わる
            try {
                // 惑星ごとに
                for (const question of questions) {
                    // 答えを持ってきて
                    const answer = wordList[question]

                    // 入力！
                    await page.type('textarea[class="GravityTypingPrompt-input js-keymaster-allow"]', answer)
                    await page.keyboard.down("Enter")
                }
            } catch {
                try {
                    console.log("入力失敗したので答えをコピーを実行")
                    // 答え取得
                    const answer = (
                        await page.$$eval('span[class="TermText notranslate lang-en"]', (options) => {
                            return options.map((option) => option.textContent)
                        })
                    )[1]

                    // 答え入力！
                    await page.type('textarea[class="GravityCopyTermView-input"]', answer)
                    await page.keyboard.down("Enter")
                } catch {
                    console.log("2回目の失敗...")
                    isFinished = true
                }
            }

            try {
                // もし失敗してたら終了
                await page.waitForSelector('h3[class="UIHeading UIHeading--three"]', { timeout: 1000 })
                isFinished = true
            } catch {
                console.log("繰り返す")
            }
        }

        console.log("〜終了〜")

        // とりま終わったらしばらく待つ
        await page.waitForTimeout(999999999)

        console.log("成功")
    } catch (err) {
        // エラーが起きた際の処理
        console.log(`エラー: ${err}`)
        errorMessage = err
    } finally {
        await browser.close()

        console.log("終了")

        // return [progress, errorMessage]
    }
}

// 外部用
module.exports.doGravity = async (url, email, password, headless = true) => {
    await doGravity(url, email, password, headless)
}
