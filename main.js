var process = require("process")
// const dotenv = require("dotenv")
const puppeteer = require("puppeteer")

const wordList = {
    "delicate, not obvious (s・6)": "subtle",
    "not easily changed (s・6)": "stable",
    "having no particular interest or sympathy; unconcerned (i・11)": "indifferent",
    "ready to attack or start fights; acting in a hostile way (a・10)": "aggressive",
    "(adj.) last, final; most important or extreme; eventual, (u・8)": "ultimate",
    "Having great depth or seriousness (p・8)": "profound",
    "holding to traditional attitudes and values and cautious about change or innovation, typically in relation to politics or religion. (c・12)":
        "conservative",
    "courageous (b・5)": "brave",
    "very strong (i・7)": "intense",
    "based on or in accordance with reason or logic (r・8)": "rational",
    "that cannot catch or be affected by a particular disease or illness (I・6)": "immune",
    "extremely important (c・7)": "crucial",
    "relating to or in the form of words (v・6)": "verbal",
    "hopeful and confident about the future (o・10)": "optimistic",
    "able to bend without breaking; able to change or to take in new ideas (f・8)": "flexible",
    "feeling or expressing gratitude; thankful (g・8)": "grateful",
    "full of energy or spirit (l・6)": "lively",
    "very great in amount (o・12)": "overwhelming",
    "more than enough; plentiful (a・8)": "abundant",
    "existing or occurring at the beginning (i・7)": "initial",
    "connected with language or the scientific study of language (l・10)": "linguistic",
    "nervous and uncomfortable with other people (s・3)": "shy",
    "relating to the sun (s・5)": "solar",
    "connected with or containing alcohol (a・9)": "alcoholic",
    "involving using the hands or physical strength (m・6)": "manual",
    "willfully causing pain or suffering to others, or feeling no concern about it. (c・5)": "cruel",
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
        // await login(username, password, page)
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
module.exports.doGravity = async (url, email, password, headless = true) => {
    await doGravity(url, email, password, headless)
}
