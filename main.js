var process = require("process")
// const dotenv = require("dotenv")
// const puppeteer = require("puppeteer")
const puppeteer = require("puppeteer-extra")

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
async function doGravity(id, username, password, headless = true) {
    console.log("start doGravity")

    const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker")
    puppeteer.use(
        AdblockerPlugin({
            blockTrackers: true,
        })
    )

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

    try {
        // まずはログイン(ログインしたくなければコメントアウトしてね)
        await login(username, password, page)
        await page.waitForNavigation({ waitUntil: "domcontentloaded" })

        console.log("単語のページに移動")

        // 単語を取得するぜ
        var wordList = {}
        const wordListURL = `https://quizlet.com/${id}`
        await page.goto(wordListURL)
        await page.evaluate((_) => {
            window.scrollBy(0, window.innerHeight * 5)
        })
        await page.evaluate((_) => {
            window.scrollBy(0, window.innerHeight * 5)
        })
        await page.waitForTimeout(3000)

        console.log("移動完了")

        // 全ての単語と問題を取得
        console.log("単語を取得中...")
        const allWords = await page.$$eval('span[class="TermText notranslate lang-en"]', (options) => {
            return options.map((option) => option.textContent)
        })

        console.log(allWords)

        for (var i = 0; i < allWords.length / 2; i++) {
            wordList[allWords[i * 2 + 1]] = allWords[i * 2]
        }

        console.log(wordList)

        // グラビティのページに行く
        const gravityURL = `https://quizlet.com/${id}/gravity`
        await page.goto(gravityURL)

        // ページのズームを切り替えるテスト(無視して)
        // await page.setViewport({
        //     width: 1280,
        //     height: 960,
        //     deviceScaleFactor: 4,
        // })

        // await page.waitForTimeout(999999)

        // ゲームを開始
        await page.waitForSelector('button[class="UIButton UIButton--hero"]')
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
            // もしここで失敗したら死んでるので終わる
            try {
                // 惑星が降りてくるまで待つ
                await page.waitForSelector('span[class="TermText notranslate lang-en"]', { timeout: 10000 })

                // 発見したら全て見つけて中身からテキストを生成
                const questions = await page.$$eval('span[class="TermText notranslate lang-en"]', (options) => {
                    return options.map((option) => option.textContent)
                })

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
                    await page.$eval('textarea[class="GravityCopyTermView-input"]', (el) => (el.value = ""))
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

        // スクショを保存するぜ
        await page.waitForTimeout(10000)
        const date = new Date().toLocaleString("sv").replace(/\D/g, "")
        await page.screenshot({ path: `screenshots/${date}.png` })

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
module.exports.doGravity = async (id, email, password, headless = true) => {
    await doGravity(id, email, password, headless)
}
