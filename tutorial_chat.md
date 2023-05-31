# **Google Cloud ハンズオン for Google Cloud Day 23 Tour**

## **Google Cloud ハンズオン**

本ハンズオンではコンテナをサーバーレスで動かすサービスである [Cloud Run](https://cloud.google.com/run) そして、フルマネージドなデータウェアハウスである [BigQuery](https://cloud.google.com/bigquery) の様々な機能を実際のリアルタイムチャット アプリケーションを用いて体験します。

Cloud Run

- Dockerfile、ソースコードから 1 コマンドで Cloud Run にデプロイ
- プライベートリリース (タグをつけたリリース) などのトラフィック コントロール
- 複数のサービスを Cloud Run で動かし連携させる

BigQuery

- Log Analytics の有効化
- ログバケット、ログルータの設定
- アプリケーションログの分析

## **Google Cloud プロジェクトの設定、確認**

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
teachme tutorial_chat.md
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
gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com pubsub.googleapis.com
```

**GUI**: [API ライブラリ](https://console.cloud.google.com/apis/library)

<walkthrough-footnote>必要な機能が使えるようになりました。次に実際に Cloud Run にアプリケーションをデプロイする方法を学びます。</walkthrough-footnote>

## **BigQuery (Log Analytics) の設定 (ログバケット)**

後ほど Log Analytics を利用して、ログを分析します。できる限り多くのログを集めておくために、ここで Cloud Run のログを送るためのバケットを作成します。

### **1. ログバケットの作成**

```bash
gcloud logging buckets create run-analytics-bucket --location asia-northeast1 --enable-analytics --async
```

### **2. ログシンクの作成**

```bash
gcloud logging sinks create run-analytics-sink logging.googleapis.com/projects/$PROJECT_ID/locations/asia-northeast1/buckets/run-analytics-bucket --log-filter 'logName:"run.googleapis.com"'
```

## **Firebase の設定**

ユーザー情報、チャットメッセージ情報は [Firestore](https://firebase.google.com/docs/firestore?hl=ja) に格納します。またリアルタイムでチャットを同期するためにも Firestore のリアルタイムアップデート機能を用います。

クライアント (JavaScript) から直接アクセスさせるため、Firebase の設定を行います。

### **1. Firebase プロジェクトの有効化**

```bash
firebase projects:addfirebase $PROJECT_ID
```

### **2. Firebase アプリケーションの作成**

```bash
firebase apps:create -P $PROJECT_ID WEB streamchat
```

### **3. Firestore 設定のアプリケーションへの埋め込み**

```bash
./scripts/firebase_config.sh
```

## **Firestore データベース、セキュリティルールの設定**

### **1. Firestore データベースの作成**

データストアとして利用する Firestore を東京リージョンに作成します。

```bash
gcloud firestore databases create --location asia-northeast1
```

### **2. Firestore を操作するための CLI の初期化**

```bash
firebase init firestore -P $PROJECT_ID
```

2 つプロンプトが出ますが両方とも Enter を押しデフォルト設定を採用します。

### **3. セキュリティルール設定ファイルを上書き**

```bash
cat << EOF > firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write;
    }
  }
}
EOF
```

### **4. 更新したルールをデプロイ**

```bash
firebase deploy --only firestore:rules -P $PROJECT_ID
```

## **Cloud Run サービスの事前作成**

以降の設定で CLoud Run サービスの URL が必要になるため、一旦ダミーでサービスをデプロイします。

```bash
gcloud run deploy streamchat --image us-docker.pkg.dev/cloudrun/container/hello --allow-unauthenticated
```

## **認証連携の設定 (OAuth 同意画面)**

チャットアプリケーションでは E-mail, パスワード認証に加え、Google アカウント認証機能を持っています。そちらの機能を有効化するために、Google Cloud の設定から OAuth2 連携 の設定を行います。

**注**: 本ステップの設定は主に GUI から行います。間違えないように注意して進めてください。

### **1. OAuth 同意画面に遷移**

<walkthrough-spotlight-pointer spotlightId="console-nav-menu">ナビゲーションメニュー</walkthrough-spotlight-pointer> -> API とサービス -> OAuth 同意画面 の順に進みます。

### **2. OAuth 同意画面**

1. `User Type` は `外部` にチェックを入れ、`作成` ボタンをクリックします。
1. アプリ情報 -> アプリ名 に `streamchat` と入力します。
1. ユーザー サポートメール は選択式です。自分のメールアドレスを選択します。
1. 最下部の デベロッパーの連絡先情報 に自分のメールアドレスを入力します。
1. 下にある `保存して次へ` ボタンをクリックします。

上記以外は未入力で大丈夫です。

### **3. スコープ、省略可能な情報、概要**

スコープ、省略可能な情報 のページは何も入力せずに、下部にある `保存して次へ` ボタンをクリックします。

概要ページでは最下部の `ダッシュボードに戻る` ボタンをクリックします。

## **認証連携の設定 (認証情報)**

### **1. 認証情報画面へ遷移**

左のメニューから `認証情報` をクリックします。

### **2. OAuth 2.0 クライアント ID を作成**

1. 上のメニューにある `+ 認証情報を作成` をクリックし、`OAuth クライアント ID` をクリックします。
1. `アプリケーションの種類` で `ウェブ アプリケーション` を選択します。
1. `名前` に `streamchat` と入力します。
1. `承認済みの JavaScript 生成元` には以下のコマンドで出力された URL を追加します。

   ```bash
   CHAT_URL=$(gcloud run services describe streamchat --format json | jq -r '.status.address.url')
   echo $CHAT_URL
   ```

1. `承認済みのリダイレクト URI` には以下のコマンドで出力された URL を追加します。

   ```bash
   echo $CHAT_URL/api/auth/callback/google
   ```

1. `作成` ボタンをクリックします。
1. `OAuth クライアントを作成しました` というウィンドウが表示されるので、`クライアント シークレット` をコピーし、`OK` をクリックしてウィンドウを閉じます。

### **3. OAuth 情報のアプリケーションへの埋め込み**

以下のスクリプトにクライアントシークレット、クライアント ID の文字列を引数に与えて実行します。

クライアントシークレットはコピー済みなので、ペーストします。クライアント ID は GUI 画面からコピーをしてペーストします。

```bash
./scripts/credentials.sh
```

実行例 (前の短い引数がクライアント シークレット、後ろの長い方がクライアント ID です)

```
./scripts/credentials.sh xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx 444444444444-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

### **4. 認証ライブラリ設定情報の埋め込み**

```bash
./scripts/nextauth_config.sh
```

このコマンドで表示される設定ファイルのそれぞれの値に、すべて値が入っていることを確認します。

## **BigQuery (Log Analytics) の設定 (ログシンク)**

後ほど Log Analytics を利用して、ログを分析します。できる限り多くのログを集めておくために、ここで Cloud Run のログを送るためのログシンクを作成します。

### **1. ログシンクの作成**

```bash
gcloud logging sinks create run-analytics-sink logging.googleapis.com/projects/$PROJECT_ID/locations/asia-northeast1/buckets/run-analytics-bucket --log-filter 'logName="run.googleapis.com"'
```

## **チャット アプリケーションのデプロイ**

Cloud Run では様々な方法でデプロイが可能です。ここでは基本的な以下の方法でアプリケーションをデプロイします。

- Dockerfile、ソースコードから 1 コマンドで Cloud Run にデプロイ

### **1. サービスアカウントの作成**

デフォルトでは Cloud Run にデプロイされたアプリケーションは強い権限を持ちます。最小権限の原則に従い、必要最小限の権限を持たせるため、まずサービス用のアカウントを作成します。

```bash
gcloud iam service-accounts create streamchat
```

### **2. チャット アプリケーションのデプロイ**

1 コマンドで Cloud Run にアプリケーションをデプロイします。

```bash
gcloud run deploy streamchat --source ./src/streamchat --allow-unauthenticated --service-account streamchat@$PROJECT_ID.iam.gserviceaccount.com
```

リポジトリを作成するか聞かれた場合は、そのまま Enter を押し作成するようにしてください。

**注**: デプロイ完了まで最大 10 分程度かかります。

## **アプリケーションの試用**

### **1. アプリケーションへブラウザからアクセス**

以下のコマンドで出力された URL をクリックすると、ブラウザのタブが開きチャットアプリケーションが起動します。

```bash
CHAT_URL=$(gcloud run services describe streamchat --format json | jq -r '.status.address.url')
echo $CHAT_URL
```

### **2. 新規ユーザーでログイン**

最下部の `Create an account` をクリックし、ユーザー情報を入力、`Register` をクリックします。

うまく登録ができると、チャット画面に遷移します。

- 最下部のウィンドウからメッセージを入力できます。
- 右上の `Sign out` ボタンからサインアウトが可能です。

### **3. Google アカウントでログイン**

ログイン画面の G マークのボタンをクリックすると、Google アカウントを使ったログインができます。

### **4. リアルタイムチャットを確認**

Chrome の通常ウィンドウ、プライベートウィンドウそれぞれで別のアカウントでログインすることで、リアルタイムにチャットができていることが確認できます。

## **チャット アプリケーションの更新**

アプリケーションにダークモードの機能をつけたいと思います。

ここでは Cloud Run の機能の１つである、タグを利用した限定リリース機能を使い、新機能を限定した URL で動作確認し、問題ないことを確認した後、本番リリースするという手順を試します。

### **1. ダークモード機能の追加**

ダークモード機能は別の Git ブランチに実装済みです。そちらにブランチを切り替えます。

```bash
git checkout darkmode
```

### **2. ダークモードの限定リリース**

```bash
gcloud run deploy streamchat --source src/streamchat --allow-unauthenticated --no-traffic --tag darkmode --service-account streamchat@$PROJECT_ID.iam.gserviceaccount.com
```

### **3. 動作確認**

前の手順で出力された URL をクリックし、ダークモードが正しく動いているかを確認します。

**注**: 新しい URL になっているため、Google ログインは失敗します。E-mail、パスワード認証からチャットウィンドウに遷移し、ダークモードを確認してください。

また元々アクセスしていた URL には影響が無いことも合わせて確認しておきましょう。

### **4. ダークモードのリリース**

限定公開されていたダークモードを全体にリリースします。

```bash
gcloud run services update-traffic streamchat --to-latest
```

元々の URL でもダークモードが追加されたことを確認します。

## **放送禁止用語フィルタ機能の追加**

チャットが荒れないように、放送禁止用語が含まれているメッセージはフィルタする機能を追加したいと思います。

今回は、放送禁止用語かどうかを判断する機能を別の Cloud Run サービスでデプロイし、2 つのサービスを非同期で連携させるようにします。

## **Pub/Sub トピックの作成、チャットアプリケーションの権限設定**

Google Cloud ではサービス連携を非同期で行うためのサービスとして [Pub/Sub](https://cloud.google.com/pubsub?hl=ja) というサービスが用意されています。

可用性、拡張性も高く、様々なユースケースに対応しています。

### **1. Pub/Sub トピックの作成**

メッセージを送る先としてトピックを作成します。

```bash
gcloud pubsub topics create streamchat
```

### **2. チャットアプリケーションへの権限追加**

チャットアプリケーションに Pub/Sub トピックへのメッセージ送信権限を付与します。

```bash
gcloud pubsub topics add-iam-policy-binding streamchat --member serviceAccount:streamchat@$PROJECT_ID.iam.gserviceaccount.com --role 'roles/pubsub.publisher'
```

## **禁止用語判定サービスのデプロイ、Pub/Sub との接続**

### **1. 放送禁止判定サービス用のサービスアカウントを作成**

```bash
gcloud iam service-accounts create banchecker
```

### **2. 放送禁止判定サービス用のサービスアカウントへの権限設定**

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID --member serviceAccount:banchecker@$PROJECT_ID.iam.gserviceaccount.com --role 'roles/datastore.user'
```

### **3. 禁止用語判定サービスのデプロイ**

```bash
gcloud run deploy banchecker --source ./src/banchecker --no-allow-unauthenticated --service-account banchecker@$PROJECT_ID.iam.gserviceaccount.com
```

### **4. Pub/Sub 用のサービスアカウントを作成**

```bash
gcloud iam service-accounts create sub-to-banchecker
```

### **5. Pub/Sub 用のサービスアカウントへの権限設定**

```bash
gcloud run services add-iam-policy-binding banchecker --member serviceAccount:sub-to-banchecker@$PROJECT_ID.iam.gserviceaccount.com --role 'roles/run.invoker'
```

### **6. Pub/Sub から判定サービスへのトリガー設定**

```bash
CHECKER_URL=$(gcloud run services describe banchecker --format json | jq -r '.status.address.url')
gcloud pubsub subscriptions create sub-to-banchecker --topic streamchat --push-endpoint $CHECKER_URL --push-auth-service-account sub-to-banchecker@$PROJECT_ID.iam.gserviceaccount.com --enable-exactly-once-delivery
```

## **チャットアプリケーションの更新**

禁止用語判定をするためのサービスのデプロイ、連携設定はできましたが、まだチャットアプリケーションはそちらに対応しておらず、直接 Firestore にデータを書き込んでいます。

ここでチャットアプリケーションを更新し、Firestore に書き込むのではなく、Pub/Sub にメッセージを書き込むように修正します。

### **1. 放送禁止用語判定サービスとの連携機能追加**

```bash
git checkout banchecker-integration
```

### **2. Firebase インデックス設定ファイルの上書き**

```bash
cat << EOF > firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "banned",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF
```

### **3. インデックスの反映**

```bash
firebase deploy --only firestore:indexes -P $PROJECT_ID
```

### **4. 連携機能のデプロイ**

```bash
gcloud run deploy streamchat --source ./src/streamchat --allow-unauthenticated --service-account streamchat@$PROJECT_ID.iam.gserviceaccount.com
```

## **放送禁止用語判定フィルタの動作確認**

チャットウィンドウの `トップチャット` をクリックすると、フィルタ済みのメッセージと、すべてのメッセージの表示を切り替えることが可能です。

放送禁止用語を含めたメッセージを送信して、フィルタがかかっているかを確かめてみましょう。

## **Log Analytics (BigQuery) を使ったログ分析**

### **1. Log Analytics 画面に遷移**

<walkthrough-spotlight-pointer spotlightId="console-nav-menu">ナビゲーションメニュー</walkthrough-spotlight-pointer> -> ロギング -> Log Analytics の順に進みます。

### **2. データが取得されているかを確認**

以下のクエリをクエリ入力画面に貼り付け、`クエリを実行` ボタンをクリックし実行してみてください。

```sql
SELECT
  timestamp, severity, resource.type, log_name, text_payload, proto_payload, json_payload
FROM
  `[PROJECT_ID].asia-northeast1.run-analytics-bucket._AllLogs`
LIMIT 50
```

**注**: [PROJECT_ID] の部分はご自身の PROJECT_ID に置き換えてください。

うまくログが取れていた場合、いくつかのログがテーブル形式で表示されます。

### **3. 様々なクエリを試してみる**

以下のクエリは前の手順と同様に [PROJECT_ID] は置き換えて実行します。

1. リクエスト数が多い順に URL へのアクセス数を調べる

   ```sql
   SELECT
     http_request.request_url, COUNT(http_request.request_url)
   FROM
     `[PROJECT_ID].asia-northeast1.run-analytics-bucket._AllLogs`
   WHERE
     http_request IS NOT NULL AND
     http_request.request_url IS NOT NULL
   GROUP BY
     http_request.request_url
   ORDER BY
     COUNT(http_request.request_url) DESC
   LIMIT 50
   ```

2. リクエストに関係ない、アプリケーションログ情報

   ```sql
   SELECT
     text_payload
   FROM
     `[PROJECT_ID].asia-northeast1.run-analytics-bucket._AllLogs`
   WHERE
     text_payload IS NOT NULL AND
     log_id != "run.googleapis.com/requests"
   LIMIT 50
   ```

様々な条件でログをクエリすることが可能です。

[サンプル SQL クエリ](https://cloud.google.com/logging/docs/analyze/examples?hl=ja) を参考に色々試してみてください。

## **Congraturations!**

<walkthrough-conclusion-trophy></walkthrough-conclusion-trophy>

これにて [Cloud Run](https://cloud.google.com/run) そして、フルマネージドなデータウェアハウスである [BigQuery](https://cloud.google.com/bigquery) を使ったハンズオンが完了です。

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
