# **はじめてみよう Cloud Run ハンズオン (Short version)**

## Cloud Run ハンズオン

本ハンズオンではコンテナをサーバーレスで動かすサービスである [Cloud Run](https://cloud.google.com/run) の様々な機能を体験します。

- Dockerfile、ソースコードから 1 コマンドで Cloud Run にデプロイ
- カナリアリリース、プライベートリリース (タグをつけたリリース) などのトラフィック コントロール
- 複数のサービスを Cloud Run で動かし連携させる
- サービスに負荷をかけ、オートスケーリングを確認
- サービスアカウントを用いたセキュリティ設定
- ロードバランサと連携させ、グローバルにサービスを配備

## Google Cloud プロジェクトの設定、確認

### **1. 対象の Google Cloud プロジェクトを設定**

ハンズオンを行う Google Cloud プロジェクトのプロジェクト ID を環境変数に設定し、以降の手順で利用できるようにします。 (右辺の [PROJECT_ID] を手動で置き換えてコマンドを実行します)

```bash
export PROJECT_ID=[PROJECT_ID]
```

`プロジェクト ID` は [ダッシュボード](https://console.cloud.google.com/home/dashboard) に進み、左上の **プロジェクト情報** から確認します。

### **2. プロジェクトの課金が有効化されていることを確認する**

```bash
gcloud beta billing projects describe ${PROJECT_ID} | grep billingEnabled
```

**Cloud Shell の承認** という確認メッセージが出た場合は **承認** をクリックします。

出力結果の `billingEnabled` が **true** になっていることを確認してください。**false** の場合は、こちらのプロジェクトではハンズオンが進められません。別途、課金を有効化したプロジェクトを用意し、本ページの #1 の手順からやり直してください。

## **環境準備**

<walkthrough-tutorial-duration duration=10></walkthrough-tutorial-duration>

最初に、ハンズオンを進めるための環境準備を行います。

下記の設定を進めていきます。

- gcloud コマンドラインツール設定
- Google Cloud 機能（API）有効化設定

## **gcloud コマンドラインツール**

Google Cloud は、コマンドライン（CLI）、GUI から操作が可能です。ハンズオンでは主に CLI を使い作業を行いますが、GUI で確認する URL も合わせて掲載します。

### **1. gcloud コマンドラインツールとは?**

gcloud コマンドライン インターフェースは、Google Cloud でメインとなる CLI ツールです。このツールを使用すると、コマンドラインから、またはスクリプトや他の自動化により、多くの一般的なプラットフォーム タスクを実行できます。

たとえば、gcloud CLI を使用して、以下のようなものを作成、管理できます。

- Google Compute Engine 仮想マシン
- Google Kubernetes Engine クラスタ
- Google Cloud SQL インスタンス

**ヒント**: gcloud コマンドラインツールについての詳細は[こちら](https://cloud.google.com/sdk/gcloud?hl=ja)をご参照ください。

### **2. gcloud から利用する Google Cloud のデフォルトプロジェクトを設定**

gcloud コマンドでは操作の対象とするプロジェクトの設定が必要です。操作対象のプロジェクトを設定します。

```bash
gcloud config set project ${PROJECT_ID}
```

承認するかどうかを聞かれるメッセージがでた場合は、`承認` ボタンをクリックします。

### **3. gcloud からの Cloud Run のデフォルト設定**

Cloud Run の利用するリージョン、プラットフォームのデフォルト値を設定します。

```bash
gcloud config set run/region asia-northeast1
gcloud config set run/platform managed
```

ここではリージョンを東京、プラットフォームをフルマネージドに設定しました。この設定を行うことで、gcloud コマンドから Cloud Run を操作するときに毎回指定する必要がなくなります。

<walkthrough-footnote>CLI（gcloud）で利用するプロジェクトの指定、Cloud Run のデフォルト値の設定が完了しました。次にハンズオンで利用する機能（API）を有効化します。</walkthrough-footnote>

## **参考: Cloud Shell の接続が途切れてしまったときは?**

一定時間非アクティブ状態になる、またはブラウザが固まってしまったなどで `Cloud Shell` が切れてしまう、またはブラウザのリロードが必要になる場合があります。その場合は以下の対応を行い、チュートリアルを再開してください。

### **1. チュートリアル資材があるディレクトリに移動する**

```bash
cd ~/gcp-getting-started-cloudrun
```

### **2. チュートリアルを開く**

```bash
teachme tutorial_short.md
```

### **3. プロジェクト ID を設定する**

```bash
export PROJECT_ID=[PROJECT_ID]
```

### **4. gcloud のデフォルト設定**

```bash
gcloud config set project ${PROJECT_ID}
gcloud config set run/region asia-northeast1
gcloud config set run/platform managed
```

途中まで進めていたチュートリアルのページまで `Next` ボタンを押し、進めてください。

## **Google Cloud 環境設定**

Google Cloud では利用したい機能（API）ごとに、有効化を行う必要があります。
ここでは、以降のハンズオンで利用する機能を事前に有効化しておきます。

```bash
gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com sourcerepo.googleapis.com container.googleapis.com
```

**GUI**: [API ライブラリ](https://console.cloud.google.com/apis/library)

<walkthrough-footnote>必要な機能が使えるようになりました。次に実際に Cloud Run にアプリケーションをデプロイする方法を学びます。</walkthrough-footnote>

## **Cloud Run へのアプリケーションのデプロイ**

<walkthrough-tutorial-duration duration=10></walkthrough-tutorial-duration>

Cloud Run では様々な方法でデプロイが可能です。ここでは基本的な以下の方法でアプリケーションをデプロイします。　

- Dockerfile、ソースコードから 1 コマンドで Cloud Run にデプロイ

<walkthrough-footnote>まず、本ハンズオンで利用するサンプルアプリケーションを見てみましょう。</walkthrough-footnote>

## **サンプルアプリケーション**

サンプル アプリケーションは Python で書かれており、HTTP で 2 つの REST API を公開しています。

- 固定文字列を返す `Hello Challenger API`
- 数値の合計を返す `数値合計 API`

このアプリケーションの主たる機能は数字の合計値を返すものなので以降、`sumservice` と呼びます。

### **Hello Challenger API**

- パス: /
  - `Hello Challenger01!` という文字列を返します。

### **数値合計 API**

- パス: /sum
  - JSON 形式で整数を複数 POST すると JSON 形式で合計値を返します。

例：

Request:

```json
{
  "numbers": [10, 20, 30]
}
```

Response:

```json
{
  "sum": 60
}
```

### **フォルダ、ファイル構成**

```terminal
.
└─ src
    └─ sumservice
        ├─ .dockerignore    # コンテナに含めないファイル群を指定するファイル
        ├─ Dockerfile       # Docker コンテナ作成定義ファイル
        ├─ Procfile         # 起動方法が記載されているファイル、Buildpacks でビルドするときに利用
        ├─ main.py          # メイン関数ソースファイル
        └─ requirements.txt # 利用ライブラリ一覧
```

<walkthrough-footnote>次に実際にアプリケーションを Cloud Run にデプロイします。</walkthrough-footnote>

## **Dockerfile、ソースコードから 1 コマンドで Cloud Run にデプロイ**

[アーキテクチャ図](https://github.com/google-cloud-japan/gcp-getting-started-cloudrun/blob/main/images/single_step_deployment_with_dockerfile.png?raw=true)

### **1. 準備**

下記のように GUI を操作し Cloud Run の管理画面を開いておきましょう。

<walkthrough-spotlight-pointer spotlightId="console-nav-menu">ナビゲーションメニュー</walkthrough-spotlight-pointer> -> サーバーレス -> Cloud Run

また以降の手順で Cloud Run の管理画面は何度も開くことになるため、ピン留め (Cloud Run メニューにマウスオーバーし、ピンのアイコンをクリック) しておくと便利です。

### **2. Cloud Run に sumservice をデプロイ**

```bash
gcloud run deploy sumservice --source src/sumservice/ --allow-unauthenticated
```

ソースコードからの初回の一括デプロイのため、Artifact Registry を作成するか聞かれます。`Enter` を押して先に進みます。

### **3. 動作確認**

```bash
SUM_URL=$(gcloud run services describe sumservice --format json | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{"numbers": [10, 20, 30, 300, 100]}' ${SUM_URL}/sum | jq
```

次のように返ってくれば、正しくアプリケーションが動作しています。

```terminal
{
  "sum": 460
}
```

<walkthrough-footnote>Dockerfile、ソースコードを 1 コマンドで簡単に Cloud Run にデプロイすることができました。次に、Cloud Run のトラフィック コントロールを試します。</walkthrough-footnote>

## **様々なリリース構成、トラフィックのコントロール**

<walkthrough-tutorial-duration duration=15></walkthrough-tutorial-duration>

Cloud Run ではリリースの構成、トラフィックのコントロールが簡単に行えます。以下のユースケースを Cloud Run で実現します。

- カナリアリリース

  新リビジョン、旧リビジョンへのアクセスを割合（%）でコントロールし、徐々に新リビジョンへのアクセス割合を増やしていく

- 新リビジョンの限定公開

  新リビジョンを特定 URL でのみ公開し、動作確認の後、本番リリースする

## **カナリアリリース**

カナリアリリースは新リビジョンをトラフィックを流さない状態でデプロイし、徐々にトラフィックを流すように設定することで実現します。

[アーキテクチャ図](https://github.com/google-cloud-japan/gcp-getting-started-cloudrun/blob/main/images/canary_release.png?raw=true)

### **1. アプリケーションにアクセス**

修正前にどのようなレスポンスが返ってくるかを確認します。

```bash
SUM_URL=$(gcloud run services describe sumservice --format json | jq -r '.status.address.url')
curl ${SUM_URL}/ && echo
```

`Hello Challenger01!` と返ってくれば成功です。

### **2. アプリケーションの修正**

```bash
sed -i -e "s/Challenger[0-9]*/Challenger10/" src/sumservice/main.py
```

`Hello Challenger10!` とレスポンスを返すように修正を行いました。

### **3. 新リビジョンのデプロイ**

```bash
gcloud run deploy sumservice --source src/sumservice/ --allow-unauthenticated --no-traffic
```

ソースコードからの初回一括デプロイのため、Artifact Registry を作成するか聞かれます。`Enter` を押して先に進みます。

**ヒント**: 新リビジョンにトラフィックを流さないよう、`--no-traffic` のオプションをつけています。これがない場合、デプロイされた瞬間にすべてのトラフィックが新リビジョンに流れます。

### **4. 新リビジョンに 10 %, 旧リビジョンに 90 % のアクセスを割り振り**

```bash
NEW_REV=$(gcloud run revisions list --format json | jq -r '.[].metadata.name' | grep 'sumservice-' | sort -r | sed -n 1p)
OLD_REV=$(gcloud run revisions list --format json | jq -r '.[].metadata.name' | grep 'sumservice-' | sort -r | sed -n 2p)
gcloud run services update-traffic sumservice --to-revisions=${NEW_REV}=10,${OLD_REV}=90
```

ターミナルに出力された URL をクリックするとブラウザが開きます。そこでリロードを繰り返してみます。まれ (10 回に 1 回) に `Hello Challenger10!` と表示されます。

### **5. すべてのアクセスを新リビジョンに割り振り**

```bash
gcloud run services update-traffic sumservice --to-latest
```

再度ブラウザからアクセスすると、何度アクセスしてもすべてのレスポンスが `Hello Challenger10!` となっていることを確認します。

<walkthrough-footnote>リビジョン、トラフィックをコントロールし、カナリアリリースを実現しました。次に、新リビジョンを特定の URL でのみデプロイする方法を学びます。</walkthrough-footnote>

## **新リビジョンの限定公開**

デプロイ時にタグを付与することで、リビジョンに特定の URL をもたせることが可能です。ここではタグと、前のページで出てきた --no-traffic を組み合わせ、新リビジョンを限定公開します。

[アーキテクチャ図](https://github.com/google-cloud-japan/gcp-getting-started-cloudrun/blob/main/images/limited_release.png?raw=true)

### **1. アプリケーションの修正**

```bash
sed -i -e 's/Challenger[0-9]*/Challenger11/' src/sumservice/main.py
```

**ヒント**: 前ページの更新で、すべてのアクセスに `Hello Challenger10!` と返すようになっていました。ここでは `Hello Challenger11!` と返すように修正します。

### **2. タグを付けて、新リビジョンをデプロイ**

```bash
gcloud run deploy sumservice --source src/sumservice/ --allow-unauthenticated --no-traffic --tag abcdefg
```

### **3. 新リビジョンへアクセス**

ターミナルに出力された**タグ付き URL** をクリックします。
新リビジョンの `Challenger11` が返ってくることを確認します。

今回デプロイしたリビジョンはこの URL でのみ稼働しています。そして、タグがない URL は旧バージョンが稼働しています。つまりこれを使うことで、**事前に限定ユーザによるテスト**が可能です。

### **4. 本番リリース（すべてのアクセスを新リビジョンに割り振り）**

```bash
gcloud run services update-traffic sumservice --to-latest
```

<walkthrough-footnote>タグ、トラフィックのコントロール機能を使うことで特定の URL でのみリリースする方法を実現しました。次は複数のサービスを Cloud Run でデプロイする方法を学びます。</walkthrough-footnote>

## **サンプルアプリケーションの拡張**

<walkthrough-tutorial-duration duration=15></walkthrough-tutorial-duration>

サンプルアプリケーションは与えられた数字を足し算するだけの簡単なものでした。これに新しい機能を追加します。

その機能は通貨情報も含めて足し算をし、結果を日本円に換算して返す機能です。

[アーキテクチャ図](https://github.com/google-cloud-japan/gcp-getting-started-cloudrun/blob/main/images/enhance_sample_application.png?raw=true)

### **インターフェース（sumservice の拡張 API）**

- パス: /sumcurrency
  - JSON 形式で、通貨ごとの数字を複数 POST すると JSON 形式で合計金額を整数で返します。（小数点以下切り捨て）

例：

Request:

```json
{
  "amounts": ["JPY100", "USD20", "EUR30"]
}
```

Response:

```json
{
  "sum": 6184
}
```

このアプリケーションはマイクロサービス アーキテクチャを採用することとし、**通貨ごとの情報は別サービス（currencyservice）が管理**することとします。

## **currencyservice**

### **日本円への換算 API**

currencyservice は他のマイクロサービスからのみリクエストを受け付ける想定です。

- パス: /convert
  - JSON 形式でレスポンス時の通貨、通貨情報付きの文字列を POST すると JSON 形式で日本円に換算した値を整数で返します。（小数点以下切り捨て）

例：

Request:

```json
{
  "value": "USD10"
}
```

Response:

```json
{
  "answer": 1098
}
```

### **フォルダ、ファイル構成**

```terminal
.
└─ src
    └─ currencyservice
        ├─ Dockerfile # Docker コンテナ作成定義ファイル
        ├─ go.mod     # モジュール定義ファイル
        └─ main.go    # メイン関数ソースファイル
```

## **currencyservice のデプロイ**

まず sumservice からアクセスを受け付ける、currencyservice をデプロイします。
currencyservice は Git を使った継続的デプロイではなく、CLI (gcloud) から操作を行います。

### **1. Cloud Run GUI に移動**

下記のように GUI を操作し Cloud Run の管理画面を開きます。

<walkthrough-spotlight-pointer spotlightId="console-nav-menu">ナビゲーションメニュー</walkthrough-spotlight-pointer> -> サーバーレス -> Cloud Run

### **2. CLI による currencyservice のデプロイ**

```bash
gcloud run deploy currencyservice --source src/currencyservice/ --allow-unauthenticated
```

### **3. 動作確認**

```bash
CURRENCY_URL=$(gcloud run services describe currencyservice --format json | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{ "value": "USD10" }' ${CURRENCY_URL}/convert | jq
```

下記のように返ってくれば正しくデプロイできています。

```terminal
{
  "answer": 1219
}
```

<walkthrough-footnote>これで currencyservice もパイプラインを使ってデプロイできました。次に sumservice がこのサービスを呼び出すように修正します。</walkthrough-footnote>

## **sumservice の更新、デプロイ**

### **1. sumservice に 新しい API を追加**

sumservice に currencyservice と連携する API（sumcurrency）の API を追加します。
`src/sumservice/main.py` にコメントアウトされた状態で記載されているので、コメントを削除します。

```bash
sed -i -e '45,72s/^#//g' src/sumservice/main.py
```

追加した (アンコメントされた) コードは下記のコマンドで確認できます。

```bash
sed -n 45,72p src/sumservice/main.py
```

### **2. デプロイ**

更新した内容をデプロイします。

```bash
gcloud run deploy sumservice --source src/sumservice/ --allow-unauthenticated
```

### **3. 環境変数の設定**

sumservice に currencyservice の URL を環境変数を通じて設定します。

```bash
CURRENCY_URL=$(gcloud run services describe currencyservice --format json | jq -r '.status.address.url')
gcloud run services update sumservice --set-env-vars=CURRENCY_SERVICE_URL=${CURRENCY_URL}
```

### **4. 動作確認**

10 US ドル + 20 ユーロ + 30 豪ドル の日本円は?

```bash
SUM_URL=$(gcloud run services describe sumservice --format json | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{ "amounts": ["USD10", "EUR20", "AUD30"] }' ${SUM_URL}/sumcurrency | jq
```

以下のように返ってくれば、正しく稼働しています。

```terminal
{
  "sum": 6673
}
```

<walkthrough-footnote>これで currencyservice と sumservice を連携させ、通貨情報も含めた足し算が行えるようになりました。次に Cloud Run のセキュリティ機能を学びます。</walkthrough-footnote>

## **セキュリティ**

<walkthrough-tutorial-duration duration=15></walkthrough-tutorial-duration>

Cloud Run では様々なセキュリティを向上させるための機能、プラクティスがあります。
今回はそのうち下記の 2 つを実施します。

- サービス個別の権限設定
- sumservice + currencyservice のセキュアな連携

[アーキテクチャ図](https://github.com/google-cloud-japan/gcp-getting-started-cloudrun/blob/main/images/security.png?raw=true)

### **Autopilot クラスタの作成**

本セクション (セキュリティ) の次のセクションで Cloud Run に負荷をかけてオートスケールを試します。そこで負荷発生ツールを稼働させるための GKE Autopilot をここで事前に作成しておきます。(ハンズオンの時間を有効利用するため)

```bash
gcloud container clusters create-auto loadtest-asia-northeast1 --region asia-northeast1 --async
```

## **サービス個別の権限設定**

デプロイ済みの 2 サービス（sumservice、currencyservice）では権限に関して特別な設定をせずにデプロイしたため、デフォルトのサービスアカウント、つまり広い権限がついている状態です。

そこで、最小権限の原則に従い、個々のサービスごとに必要な権限を付与するため、個別にサービスアカウントを用意し権限を付与します。

### **1. サービスアカウントの作成**

sumservice, currecyservice それぞれ固有のサービスアカウントを作成します。

```bash
gcloud iam service-accounts create sumservice-sa --display-name "Service Account for sumservice"
```

```bash
gcloud iam service-accounts create currencyservice-sa --display-name "Service Account for currencyservice"
```

### **2. サービスアカウントを適用**

作成したサービスアカウントを、それぞれのサービスに適用します。

```bash
gcloud run services update sumservice --service-account=sumservice-sa
```

```bash
gcloud run services update currencyservice --service-account=currencyservice-sa
```

<walkthrough-footnote>これで sumservice、currencyservice はそれぞれ最小の権限のみでアプリケーションが稼働するようになりました。次にこの権限を利用し、それぞれのサービスをセキュアに連携するようにします。</walkthrough-footnote>

## **sumservice + currencyservice のセキュアな連携**

currencyservice は他サービスからのみ呼び出される想定ですが、今の設定では誰でもアクセスができてしまっています。

そこで現在連携している sumservice からのみアクセスが可能なように設定します。

### **1. currencyservice の sumservice からの呼び出し許可**

sumservice から currencyservice を呼び出せるように sumservice のサービスアカウントに権限を付与します。

```bash
gcloud run services add-iam-policy-binding currencyservice --member="serviceAccount:sumservice-sa@${PROJECT_ID}.iam.gserviceaccount.com" --role='roles/run.invoker'
```

### **2. sumservice の修正、デプロイ**

sumservice のソースコードを修正し、currencyservice を呼び出すときにトークンを取得し、それを利用するように修正します。

```bash
sed -i -e '58s/#//' src/sumservice/main.py
```

修正した内容をデプロイします。

```bash
gcloud run deploy sumservice --source src/sumservice/ --allow-unauthenticated
```

### **3. currencyservice の全利用者呼び出し許可設定削除**

最後に currencyservice の呼び出し許可設定を変更し、権限を持っているサービスアカウントのみ呼び出せるようにします。

```bash
gcloud run services remove-iam-policy-binding currencyservice --member="allUsers" --role="roles/run.invoker"
```

### **4. 動作確認**

sumservice からは引き続き連携ができていることを確認します。

```bash
SUM_URL=$(gcloud run services describe sumservice --format json | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{ "amounts": ["USD10", "EUR20", "AUD30"] }' ${SUM_URL}/sumcurrency | jq
```

currencyservice へ直接アクセスをすると、権限エラー (403) が出るようになったことを確認します。

```bash
CURRENCY_URL=$(gcloud run services describe currencyservice --format json | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{ "value": "USD10" }' ${CURRENCY_URL}/convert
```

直接アクセスができてしまっている場合は、少し待ってみてください。

<walkthrough-footnote>これで sumservice、currencyservice はそれぞれ最小の権限のみで稼働し、さらにマイクロサービス群がセキュアに連携できるようになりました。次に Cloud Run のパフォーマンスについて学びましょう。</walkthrough-footnote>

## **パフォーマンス・チューニング**

<walkthrough-tutorial-duration duration=15></walkthrough-tutorial-duration>

Cloud Run では、負荷に応じて自動的にスケールします。
サンプルアプリケーションに負荷をかけてみて、実際にスケールが行われる様子、そしてリソース状況、ログ、テレメトリ情報を見てみましょう。

下記に示す手順で作業を進めます。

- 負荷ツールの導入
- アプリケーションへの負荷テスト
- スケーリング、リソース状況、ログの確認
- 設定値を修正し、挙動の確認

## **負荷ツールの導入**

負荷を掛けるツールとして [Locust](https://github.com/locustio/locust) を利用します。これは Python で書かれたオープンソースのツールで、独自の UI を持っている、また分散構成で負荷を掛けることができるなどの特長があります。

ここでは Locust を [GKE Autopilot](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview) 上に導入します。

### **1. Autopilot クラスタが作成完了しているかを確認**

Autopilot クラスタの作成コマンドは事前に実行しています。

```bash
gcloud container clusters list --format json | jq -r '.[].status' | grep 'RUNNING' 
```

### **2. Autopilot クラスタへのアクセス設定**

```bash
gcloud container clusters get-credentials loadtest-asia-northeast1 --region asia-northeast1
```

### **3. Locust のデプロイ**

Kubernetes 上で動かすため、[helm](https://helm.sh/ja/) を使い Locust を導入します。

helm チャートの追加:

```bash
helm repo add deliveryhero https://charts.deliveryhero.io/
```

locust file の読み込み:

```bash
kubectl create configmap loadtest-sumservice-locustfile --from-file src/locust/main.py
```

locust のインストール:

```bash
SUM_URL=$(gcloud run services describe sumservice --format json | jq -r '.status.address.url')
helm install locust deliveryhero/locust --set loadtest.locust_locustfile_configmap=loadtest-sumservice-locustfile --set loadtest.name=loadtest-sumservice --set worker.replicas=2 --set loadtest.locust_host=${SUM_URL}
```

次のコマンドを実行し、Pod が稼働状態（Running）になるまで待ちます。すべての Pod で STATUS が `Running` 、READY が `1/1` になったら、Ctrl+C で抜けます。

```bash
watch -n 5 kubectl get pods
```

3 分程度時間がかかります。

### **4. Web UI の確認**

Locust にはポートフォワードを通して UI にアクセスします。Cloud Shell への 8080 ポートへのアクセスを、Locust のポート 8089 に転送する設定を行います。

```bash
kubectl --namespace default port-forward service/locust 8080:8089
```

プレビューボタン <walkthrough-web-preview-icon></walkthrough-web-preview-icon> をクリックし、ポート 8080 でプレビューをクリックします。

無事、Locust の UI が見えれば成功です。

<walkthrough-footnote>負荷ツールの Locust を GKE Autopilot 上に構築しました。次にこのツールを使い、デプロイ済みのマイクロサービスに負荷をかけてみます。</walkthrough-footnote>

## **アプリケーションへの負荷テスト**

### **1. Locust からの負荷テスト** [![screenshot](https://github.com/google-cloud-japan/gcp-getting-started-cloudrun/blob/main/images/link_image.png?raw=true)](https://github.com/google-cloud-japan/gcp-getting-started-cloudrun/blob/main/images/locust_ui.png?raw=true)

Locust からアプリケーションに負荷をかけ、スケーリング、エラー、負荷の状況を確認します。

Locust の UI にて下記の数値を入力後、`Start swarming` をクリックします。

- `Number of total users to simulate`: 1500
- `Spawn rate`: 30

1 秒あたりアクセスが 30 ユーザー増加し、最終的に 1500 ユーザーがアクセスしている状態をシミュレートしています。

### **2. Cloud Run UI, Locust UI からの負荷状況の確認**

コンテナインスタンスの数、レイテンシ、CPU、メモリなどのメトリクスが負荷に応じてどのように変化するかを見てみましょう。

- [sumservice UI](https://console.cloud.google.com/run/detail/asia-northeast1/sumservice/metrics)
- [currencyservice UI](https://console.cloud.google.com/run/detail/asia-northeast1/currencyservice/metrics)

**完了後、Locust からの負荷テストは止めましょう。Locust UI のメニュー内の STOP ボタンをクリックします。またターミナルでは port-forward を Ctrl-C で終了します。**

<walkthrough-footnote>負荷ツールを利用し、Cloud Run に負荷をかけ、UI から挙動を確認しました。次に展開しているマイクロサービスをグローバルに展開する方法を学びます。</walkthrough-footnote>

## **サンプルアプリケーションのグローバル展開**

<walkthrough-tutorial-duration duration=10></walkthrough-tutorial-duration>

Cloud Run は Load balancer と組み合わせることで、簡単にアプリケーションをグローバルで展開することが可能です。

今は東京リージョンのみ稼働しているアプリケーションを、アメリカにも配置してみましょう。

[アーキテクチャ図](https://github.com/google-cloud-japan/gcp-getting-started-cloudrun/blob/main/images/global_deployment.png?raw=true)

この設定を行うことで、利用者から見ると同じ IP アドレスにアクセスしていながら、自動的に利用者により近い Cloud Run にルーティングされ、ユーザ体験が向上します。

グローバル展開をするには下記の手順を実施します。

- HTTPS ロードバランサの作成
- アメリカにアプリケーションをデプロイ
- 動作確認

**ヒント**: 本ハンズオンでは手順をスクリプトにまとめて実行しています。詳しい手順を知りたい方は [複数のリージョンからのトラフィックの処理](https://cloud.google.com/run/docs/multiple-regions) を参照ください。

## **HTTPS ロードバランサの作成**

### **1. 自己署名証明書の作成**

HTTPS ロードバランサに SSL 証明書を紐付ける必要があります。そのためにまず自己署名証明書を作成します。

```bash
bash scripts/create_self-cert.sh
```

それぞれ質問された項目に、値を入力します。（下記はサンプルです。）

- Country Name: JP
- State or Province Name: Tokyo
- Locality Name: Minato
- Organization Name: Sugoi Cloud G.K.
- Organizational Unit Name: Cloud
- Common Name: sugoicloud.com
- Email Address: admin@sugoicloud.com

カレントディレクトリに以下の 2 ファイルが作成されます。

- private.key: 秘密鍵ファイル
- sumservice.crt: 証明書ファイル

### **2. HTTPS ロードバランサの作成**

先程作成した証明書などのファイルを使い、ロードバランサを作成します。

```bash
bash scripts/setup_loadbalancer.sh
```

<walkthrough-footnote>自己署名証明書を使い、HTTPS ロードバランサを作成しました。次にアメリカに sumservice, currencyservice をデプロイします。</walkthrough-footnote>

## **アメリカ（us-central1）にアプリケーションをデプロイ**

アメリカにも sumservice、currencyservice をデプロイしましょう。

### **1. currencyservice のデプロイ**

```bash
gcloud run deploy currencyservice --source src/currencyservice/ --no-allow-unauthenticated --region us-central1 --service-account currencyservice-sa@${PROJECT_ID}.iam.gserviceaccount.com
```

us-central1 リージョンでソースからの初めてのデプロイのため、Artifact Registry を作成するか聞かれます。`Enter` を押して先に進みます。

### **2. sumservice からのアクセス許可設定**

```bash
gcloud run services add-iam-policy-binding currencyservice --member="serviceAccount:sumservice-sa@${PROJECT_ID}.iam.gserviceaccount.com" --role='roles/run.invoker' --region us-central1
```

### **3. sumservice のデプロイ**

```bash
gcloud run deploy sumservice --source src/sumservice/ --allow-unauthenticated --region us-central1 --service-account sumservice-sa@${PROJECT_ID}.iam.gserviceaccount.com
```

### **4. sumservice へ currencyservice の URL を設定**

```bash
CURRENCY_URL=$(gcloud run services describe currencyservice --format json --region us-central1 | jq -r '.status.address.url')
gcloud run services update sumservice --set-env-vars=CURRENCY_SERVICE_URL=${CURRENCY_URL} --region us-central1
```

### **5. 動作確認**

sumservice 単体の API: /sum

```bash
SUM_URL=$(gcloud run services describe sumservice --format json --region us-central1 | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{"numbers": [10, 20, 30, 300, 100]}' ${SUM_URL}/sum | jq
```

sumservice + currencyservice が連携している API: /sumcurrency

```bash
SUM_URL=$(gcloud run services describe sumservice --format json --region us-central1 | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{ "amounts": ["USD10", "EUR20", "AUD30"] }' ${SUM_URL}/sumcurrency | jq
```

<walkthrough-footnote>アメリカに sumservice, currencyservice をデプロイしました。次に先程作成したロードバランサに日本、アメリカで稼働しているアプリケーションを紐付けます。</walkthrough-footnote>

## **リージョンバックエンドの構成、動作確認**

### **1. NEG の作成、バックエンドサービスへの追加**

東京、アメリカで稼働しているアプリケーションを HTTPS ロードバランサに紐付けます。

```bash
bash scripts/add_sumservice_to_backend.sh asia-northeast1
bash scripts/add_sumservice_to_backend.sh us-central1
```

### **2. 動作確認**

ロードバランサにアクセスをし、正しく結果が返ってくることを確認します。

```bash
LB_IP=$(gcloud compute addresses describe --global sumservice-ip --format='value(address)')
curl -s -k -H "Content-Type: application/json" -d '{"numbers": [10, 20, 30, 300, 100]}' https://${LB_IP}/sum | jq
curl -s -k -H "Content-Type: application/json" -d '{ "amounts": ["USD10", "EUR20", "AUD30"] }' https://${LB_IP}/sumcurrency | jq
```

エラーが返ってくる場合は、少し待ってみてから再度アクセスをしてみてください。

<walkthrough-footnote>ロードバランサに Cloud Run を連携させることができました。これで日本、アメリカそれぞれの利用者が高いユーザ体験を得ることが可能です。次に、ロードバランサを使った、より本番で必要になる設定を導入します。</walkthrough-footnote>

## **sumservice をロードバランサと内部からのアクセスに制限**

currencyservice は権限を持った方のみがアクセスできる状態ですが、sumservice は誰でもインターネットを通してアクセスできる状態です。

ロードバランサを前段に配置したので、インターネットからはロードバランサを経由したアクセスのみを許可するように設定をしましょう。

こうすることで、セキュリティの向上、Cloud Armor と組み合わせた DDoS 対策、Cloud CDN を利用したパフォーマンスの向上といった恩恵が得られます。

### **1. アクセスができる状態の確認**

東京:

```bash
SUM_URL=$(gcloud run services describe sumservice --format json --region asia-northeast1 | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{"numbers": [10, 20, 30, 300, 100]}' ${SUM_URL}/sum | jq
```

アメリカ:

```bash
SUM_URL=$(gcloud run services describe sumservice --format json --region us-central1 | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{"numbers": [10, 20, 30, 300, 100]}' ${SUM_URL}/sum | jq
```

### **2. アクセス許可設定（ingress）を修正**

オプションの `--ingress internal-and-cloud-load-balancing` がポイントです。

東京の sumservice:

```bash
gcloud run services update sumservice --ingress internal-and-cloud-load-balancing --region asia-northeast1
```

アメリカの sumservice:

```bash
gcloud run services update sumservice --ingress internal-and-cloud-load-balancing --region us-central1
```

### **3. 再度直接アクセスを試してみる**

東京:

```bash
SUM_URL=$(gcloud run services describe sumservice --format json --region asia-northeast1 | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{"numbers": [10, 20, 30, 300, 100]}' ${SUM_URL}/sum
```

アメリカ:

```bash
SUM_URL=$(gcloud run services describe sumservice --format json --region us-central1 | jq -r '.status.address.url')
curl -s -H "Content-Type: application/json" -d '{"numbers": [10, 20, 30, 300, 100]}' ${SUM_URL}/sum
```

### **4. ロードバランサ経由でのアクセス**

```bash
LB_IP=$(gcloud compute addresses describe --global sumservice-ip --format='value(address)')
curl -s -k -H "Content-Type: application/json" -d '{"numbers": [10, 20, 30, 300, 100]}' https://${LB_IP}/sum | jq
curl -s -k -H "Content-Type: application/json" -d '{ "amounts": ["USD10", "EUR20", "AUD30"] }' https://${LB_IP}/sumcurrency | jq
```

<walkthrough-footnote>無事、アクセスをロードバランサからのみに制限することができました。</walkthrough-footnote>

## **Congraturations!**

<walkthrough-conclusion-trophy></walkthrough-conclusion-trophy>

これにて Cloud Run を利用したアプリケーションのデプロイ、セキュリティ向上策の導入、パフォーマンス・チューニング、そしてロードバランサを使ったグローバル展開が完了しました。

デモで使った資材が不要な方は、次の手順でクリーンアップを行って下さい。

## **クリーンアップ（プロジェクトを削除）**

ハンズオン用に利用したプロジェクトを削除し、コストがかからないようにします。

### **1. Google Cloud のデフォルトプロジェクト設定の削除**

```bash
gcloud config unset project
```

### **2. プロジェクトの削除**

```bash
gcloud projects delete ${PROJECT_ID}
```

### **3. ハンズオン資材の削除**

```bash
cd $HOME && rm -rf gcp-getting-started-cloudrun gopath
```
