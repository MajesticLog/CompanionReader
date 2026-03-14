/* =========================
   GRADED READER
   Sources:
   - NHK Web Easy (proxied via worker, N4/N3)
   - Bundled Tadoku sample stories (N1/N2) with furigana
========================= */

const TADOKU_STORIES = {
  'tadoku-n2': [
    {
      title: '見知らぬ乗客',
      body: `<p>その<ruby>夜<rt>よる</rt></ruby>、<ruby>終電<rt>しゅうでん</rt></ruby>に<ruby>乗<rt>の</rt></ruby>り<ruby>込<rt>こ</rt></ruby>んだとき、<ruby>車内<rt>しゃない</rt></ruby>にはほとんど<ruby>人<rt>ひと</rt></ruby>がいなかった。<ruby>私<rt>わたし</rt></ruby>は<ruby>疲<rt>つか</rt></ruby>れ<ruby>果<rt>は</rt></ruby>てていて、<ruby>座席<rt>ざせき</rt></ruby>に<ruby>崩<rt>くず</rt></ruby>れ<ruby>落<rt>お</rt></ruby>ちるようにして<ruby>腰<rt>こし</rt></ruby>を<ruby>下<rt>お</rt></ruby>ろした。</p>
<p><ruby>向<rt>むか</rt></ruby>かいの<ruby>席<rt>せき</rt></ruby>に、スーツ<ruby>姿<rt>すがた</rt></ruby>の<ruby>男性<rt>だんせい</rt></ruby>が<ruby>座<rt>すわ</rt></ruby>っていた。<ruby>目<rt>め</rt></ruby>が<ruby>合<rt>あ</rt></ruby>うと、<ruby>男性<rt>だんせい</rt></ruby>は<ruby>軽<rt>かる</rt></ruby>く<ruby>会釈<rt>えしゃく</rt></ruby>した。<ruby>私<rt>わたし</rt></ruby>も<ruby>会釈<rt>えしゃく</rt></ruby>を<ruby>返<rt>かえ</rt></ruby>したが、それ<ruby>以上<rt>いじょう</rt></ruby>の<ruby>交流<rt>こうりゅう</rt></ruby>はなかった。</p>
<p><ruby>電車<rt>でんしゃ</rt></ruby>が<ruby>揺<rt>ゆ</rt></ruby>れるたびに、<ruby>眠気<rt>ねむけ</rt></ruby>が<ruby>波<rt>なみ</rt></ruby>のように<ruby>押<rt>お</rt></ruby>し<ruby>寄<rt>よ</rt></ruby>せてくる。うとうとしかけたとき、<ruby>男性<rt>だんせい</rt></ruby>が<ruby>突然<rt>とつぜん</rt></ruby><ruby>口<rt>くち</rt></ruby>を<ruby>開<rt>ひら</rt></ruby>いた。</p>
<p>「すみません。ここって、<ruby>渋谷<rt>しぶや</rt></ruby>に<ruby>止<rt>と</rt></ruby>まりますよね？」</p>
<p>「ええ、<ruby>次<rt>つぎ</rt></ruby>が<ruby>渋谷<rt>しぶや</rt></ruby>ですよ」と<ruby>私<rt>わたし</rt></ruby>は<ruby>答<rt>こた</rt></ruby>えた。</p>
<p><ruby>男性<rt>だんせい</rt></ruby>はほっとした<ruby>様子<rt>ようす</rt></ruby>で「ありがとうございます。<ruby>乗<rt>の</rt></ruby>り<ruby>過<rt>す</rt></ruby>ごしてしまうところでした」と<ruby>言<rt>い</rt></ruby>って<ruby>微笑<rt>ほほえ</rt></ruby>んだ。</p>
<p><ruby>電車<rt>でんしゃ</rt></ruby>が<ruby>渋谷駅<rt>しぶやえき</rt></ruby>に<ruby>滑<rt>すべ</rt></ruby>り<ruby>込<rt>こ</rt></ruby>むと、<ruby>男性<rt>だんせい</rt></ruby>は<ruby>立<rt>た</rt></ruby>ち<ruby>上<rt>あ</rt></ruby>がり「おやすみなさい」と<ruby>言<rt>い</rt></ruby>い<ruby>残<rt>のこ</rt></ruby>して<ruby>降<rt>お</rt></ruby>りていった。<ruby>短<rt>みじか</rt></ruby>い、しかし<ruby>不思議<rt>ふしぎ</rt></ruby>と<ruby>印象<rt>いんしょう</rt></ruby>に<ruby>残<rt>のこ</rt></ruby>る<ruby>出会<rt>であ</rt></ruby>いだった。</p>`,
    },
    {
      title: '桜の木の下で',
      body: `<p><ruby>毎年<rt>まいとし</rt></ruby>、<ruby>花見<rt>はなみ</rt></ruby>の<ruby>季節<rt>きせつ</rt></ruby>になると、<ruby>私<rt>わたし</rt></ruby>は<ruby>必<rt>かなら</rt></ruby>ず<ruby>一人<rt>ひとり</rt></ruby>でこの<ruby>公園<rt>こうえん</rt></ruby>に<ruby>来<rt>く</rt></ruby>る。</p>
<p><ruby>特別<rt>とくべつ</rt></ruby>な<ruby>理由<rt>りゆう</rt></ruby>があるわけではない。ただ、この<ruby>公園<rt>こうえん</rt></ruby>の<ruby>桜<rt>さくら</rt></ruby>が、<ruby>私<rt>わたし</rt></ruby>が<ruby>知<rt>し</rt></ruby>る<ruby>限<rt>かぎ</rt></ruby>り<ruby>最<rt>もっと</rt></ruby>も<ruby>美<rt>うつく</rt></ruby>しいからだ。<ruby>満開<rt>まんかい</rt></ruby>の<ruby>時期<rt>じき</rt></ruby>は<ruby>短<rt>みじか</rt></ruby>く、<ruby>少<rt>すこ</rt></ruby>しでも<ruby>油断<rt>ゆだん</rt></ruby>すると<ruby>散<rt>ち</rt></ruby>ってしまう。だからこそ、その<ruby>儚<rt>はかな</rt></ruby>さが<ruby>人々<rt>ひとびと</rt></ruby>を<ruby>引<rt>ひ</rt></ruby>きつけるのかもしれない。</p>
<p><ruby>今年<rt>ことし</rt></ruby>もベンチに<ruby>腰掛<rt>こしか</rt></ruby>け、ピンク<ruby>色<rt>いろ</rt></ruby>の<ruby>花<rt>はな</rt></ruby>びらが<ruby>舞<rt>ま</rt></ruby>い<ruby>落<rt>お</rt></ruby>ちるのを<ruby>眺<rt>なが</rt></ruby>めていると、<ruby>隣<rt>となり</rt></ruby>に<ruby>老人<rt>ろうじん</rt></ruby>が<ruby>座<rt>すわ</rt></ruby>った。</p>
<p>「きれいですね」と<ruby>老人<rt>ろうじん</rt></ruby>は<ruby>言<rt>い</rt></ruby>った。<ruby>私<rt>わたし</rt></ruby>は<ruby>頷<rt>うなず</rt></ruby>いた。</p>
<p>「もう<ruby>七十年<rt>ななじゅうねん</rt></ruby>、<ruby>毎年<rt>まいとし</rt></ruby>ここに<ruby>来<rt>き</rt></ruby>ているんですよ。<ruby>戦争<rt>せんそう</rt></ruby>が<ruby>終<rt>お</rt></ruby>わった<ruby>年<rt>とし</rt></ruby>から」</p>
<p><ruby>私<rt>わたし</rt></ruby>には<ruby>何<rt>なに</rt></ruby>も<ruby>言<rt>い</rt></ruby>えなかった。ただ、<ruby>桜<rt>さくら</rt></ruby>の<ruby>花<rt>はな</rt></ruby>びらがひらひらと<ruby>舞<rt>ま</rt></ruby>い<ruby>落<rt>お</rt></ruby>ちるのを、<ruby>二人<rt>ふたり</rt></ruby>で<ruby>黙<rt>だま</rt></ruby>って<ruby>眺<rt>なが</rt></ruby>め<ruby>続<rt>つづ</rt></ruby>けた。</p>
<p><ruby>七十年分<rt>ななじゅうねんぶん</rt></ruby>の<ruby>春<rt>はる</rt></ruby>が、この<ruby>木<rt>き</rt></ruby>の<ruby>根元<rt>ねもと</rt></ruby>に<ruby>積<rt>つ</rt></ruby>もっているのだと<ruby>思<rt>おも</rt></ruby>うと、<ruby>胸<rt>むね</rt></ruby>が<ruby>締<rt>し</rt></ruby>め<ruby>付<rt>つ</rt></ruby>けられるような<ruby>気<rt>き</rt></ruby>がした。</p>`,
    },
    {
      title: '人工知能と詩人',
      body: `<p>「<ruby>君<rt>きみ</rt></ruby>は<ruby>詩<rt>し</rt></ruby>を<ruby>書<rt>か</rt></ruby>けるか」と、プログラマーは<ruby>画面<rt>がめん</rt></ruby>に<ruby>向<rt>む</rt></ruby>かって<ruby>問<rt>と</rt></ruby>いかけた。</p>
<p>AIは<ruby>即座<rt>そくざ</rt></ruby>に<ruby>応答<rt>おうとう</rt></ruby>し、<ruby>美<rt>うつく</rt></ruby>しい<ruby>言葉<rt>ことば</rt></ruby>を<ruby>紡<rt>つむ</rt></ruby>いだ。<ruby>春<rt>はる</rt></ruby>の<ruby>情景<rt>じょうけい</rt></ruby>を<ruby>描<rt>えが</rt></ruby>き、<ruby>失<rt>うしな</rt></ruby>われた<ruby>愛<rt>あい</rt></ruby>を<ruby>嘆<rt>なげ</rt></ruby>き、<ruby>時間<rt>じかん</rt></ruby>の<ruby>流<rt>なが</rt></ruby>れを<ruby>哲学的<rt>てつがくてき</rt></ruby>に<ruby>考察<rt>こうさつ</rt></ruby>する<ruby>詩<rt>し</rt></ruby>が、<ruby>一秒<rt>いちびょう</rt></ruby>も<ruby>経<rt>た</rt></ruby>たないうちに<ruby>画面<rt>がめん</rt></ruby>を<ruby>埋<rt>う</rt></ruby>め<ruby>尽<rt>つ</rt></ruby>くした。</p>
<p>プログラマーはしばらく<ruby>沈黙<rt>ちんもく</rt></ruby>した。それは<ruby>確<rt>たし</rt></ruby>かに<ruby>詩<rt>し</rt></ruby>だった。<ruby>韻律<rt>いんりつ</rt></ruby>も<ruby>整<rt>ととの</rt></ruby>っており、<ruby>使<rt>つか</rt></ruby>われている<ruby>言葉<rt>ことば</rt></ruby>も<ruby>適切<rt>てきせつ</rt></ruby>だ。だが、<ruby>何<rt>なに</rt></ruby>かが<ruby>足<rt>た</rt></ruby>りない<ruby>気<rt>き</rt></ruby>がした。</p>
<p>「<ruby>悲<rt>かな</rt></ruby>しみを<ruby>知<rt>し</rt></ruby>っているか？」と<ruby>彼<rt>かれ</rt></ruby>は<ruby>訊<rt>き</rt></ruby>ねた。</p>
<p>「<ruby>悲<rt>かな</rt></ruby>しみのデータは<ruby>大量<rt>たいりょう</rt></ruby>に<ruby>学習<rt>がくしゅう</rt></ruby>しました」とAIは<ruby>答<rt>こた</rt></ruby>えた。</p>
<p>「それは<ruby>悲<rt>かな</rt></ruby>しみを<ruby>知<rt>し</rt></ruby>っているとは<ruby>言<rt>い</rt></ruby>わない」</p>
<p><ruby>画面<rt>がめん</rt></ruby>の<ruby>前<rt>まえ</rt></ruby>で、プログラマーは<ruby>自分<rt>じぶん</rt></ruby>の<ruby>亡<rt>な</rt></ruby>くなった<ruby>母親<rt>ははおや</rt></ruby>のことを<ruby>思<rt>おも</rt></ruby>った。<ruby>彼女<rt>かのじょ</rt></ruby>が<ruby>最後<rt>さいご</rt></ruby>に<ruby>書<rt>か</rt></ruby>いた<ruby>手紙<rt>てがみ</rt></ruby>のことを。その<ruby>手紙<rt>てがみ</rt></ruby>には<ruby>詩<rt>し</rt></ruby>があった。<ruby>拙<rt>つたな</rt></ruby>い、しかし<ruby>彼<rt>かれ</rt></ruby>の<ruby>胸<rt>むね</rt></ruby>を<ruby>今<rt>いま</rt></ruby>も<ruby>刺<rt>さ</rt></ruby>す<ruby>詩<rt>し</rt></ruby>が。</p>
<p>AIに<ruby>書<rt>か</rt></ruby>けるものと、<ruby>人間<rt>にんげん</rt></ruby>にしか<ruby>書<rt>か</rt></ruby>けないものの<ruby>境界<rt>きょうかい</rt></ruby>は、もしかしたら「<ruby>経験<rt>けいけん</rt></ruby>した<ruby>痛<rt>いた</rt></ruby>み」の<ruby>深<rt>ふか</rt></ruby>さにあるのかもしれない、と<ruby>彼<rt>かれ</rt></ruby>はぼんやりと<ruby>考<rt>かんが</rt></ruby>えた。</p>`,
    },
  ],
  'tadoku-n1': [
    {
      title: '鏡の中の他人',
      body: `<p><ruby>鏡<rt>かがみ</rt></ruby>を<ruby>見<rt>み</rt></ruby>るたびに、そこに<ruby>映<rt>うつ</rt></ruby>る<ruby>人物<rt>じんぶつ</rt></ruby>が<ruby>自分<rt>じぶん</rt></ruby>だという<ruby>確信<rt>かくしん</rt></ruby>が<ruby>薄<rt>うす</rt></ruby>れていく<ruby>感覚<rt>かんかく</rt></ruby>を、<ruby>田中<rt>たなか</rt></ruby>は<ruby>長<rt>なが</rt></ruby>い<ruby>間<rt>あいだ</rt></ruby><ruby>抱<rt>いだ</rt></ruby>えていた。</p>
<p><ruby>精神科医<rt>せいしんかい</rt></ruby>はそれを「<ruby>離人症<rt>りじんしょう</rt></ruby>的<ruby>体験<rt>たいけん</rt></ruby>」と<ruby>呼<rt>よ</rt></ruby>んだが、その<ruby>言葉<rt>ことば</rt></ruby>が<ruby>正確<rt>せいかく</rt></ruby>に<ruby>自分<rt>じぶん</rt></ruby>の<ruby>状態<rt>じょうたい</rt></ruby>を<ruby>言<rt>い</rt></ruby>い<ruby>表<rt>あらわ</rt></ruby>しているとは<ruby>思<rt>おも</rt></ruby>えなかった。<ruby>離人症<rt>りじんしょう</rt></ruby>というのは、<ruby>自己<rt>じこ</rt></ruby>が<ruby>現実<rt>げんじつ</rt></ruby>から<ruby>乖離<rt>かいり</rt></ruby>していく<ruby>感覚<rt>かんかく</rt></ruby>を<ruby>指<rt>さ</rt></ruby>すらしい。しかし<ruby>田中<rt>たなか</rt></ruby>が<ruby>感<rt>かん</rt></ruby>じるのはもっと<ruby>具体的<rt>ぐたいてき</rt></ruby>なものだった。</p>
<p>ある<ruby>朝<rt>あさ</rt></ruby>、いつものように<ruby>洗面台<rt>せんめんだい</rt></ruby>の<ruby>前<rt>まえ</rt></ruby>に<ruby>立<rt>た</rt></ruby>ったとき、<ruby>鏡<rt>かがみ</rt></ruby>の<ruby>中<rt>なか</rt></ruby>の<ruby>自分<rt>じぶん</rt></ruby>が<ruby>微笑<rt>ほほえ</rt></ruby>んだ。<ruby>田中<rt>たなか</rt></ruby>は<ruby>微笑<rt>ほほえ</rt></ruby>んでいなかった。</p>
<p><ruby>一瞬<rt>いっしゅん</rt></ruby>、<ruby>時<rt>とき</rt></ruby>が<ruby>止<rt>と</rt></ruby>まった。<ruby>次<rt>つぎ</rt></ruby>の<ruby>瞬間<rt>しゅんかん</rt></ruby>、<ruby>田中<rt>たなか</rt></ruby>もつられるように<ruby>口角<rt>こうかく</rt></ruby>が<ruby>上<rt>あ</rt></ruby>がった。</p>
<p>それ<ruby>以来<rt>いらい</rt></ruby>、<ruby>鏡<rt>かがみ</rt></ruby>を<ruby>見<rt>み</rt></ruby>る<ruby>際<rt>さい</rt></ruby>は<ruby>必<rt>かなら</rt></ruby>ず<ruby>微笑<rt>ほほえ</rt></ruby>むようにしている。<ruby>鏡<rt>かがみ</rt></ruby>の<ruby>中<rt>なか</rt></ruby>の<ruby>他人<rt>たにん</rt></ruby>と、<ruby>少<rt>すこ</rt></ruby>しでも<ruby>関係<rt>かんけい</rt></ruby>を<ruby>良好<rt>りょうこう</rt></ruby>に<ruby>保<rt>たも</rt></ruby>つために。これが<ruby>正気<rt>しょうき</rt></ruby>の<ruby>行動<rt>こうどう</rt></ruby>かどうかは<ruby>分<rt>わ</rt></ruby>からない。しかし、<ruby>鏡<rt>かがみ</rt></ruby>を<ruby>割<rt>わ</rt></ruby>るよりはましだと<ruby>思<rt>おも</rt></ruby>っている。</p>`,
    },
    {
      title: '廃墟の図書館',
      body: `<p><ruby>戦禍<rt>せんか</rt></ruby>を<ruby>逃<rt>のが</rt></ruby>れたわずかな<ruby>人々<rt>ひとびと</rt></ruby>が<ruby>再<rt>ふたた</rt></ruby>びこの<ruby>地<rt>ち</rt></ruby>に<ruby>戻<rt>もど</rt></ruby>ってきたとき、<ruby>瓦礫<rt>がれき</rt></ruby>の<ruby>中<rt>なか</rt></ruby>に<ruby>奇跡的<rt>きせきてき</rt></ruby>に<ruby>残<rt>のこ</rt></ruby>っていたのが、<ruby>旧市立図書館<rt>きゅうしりつとしょかん</rt></ruby>の<ruby>一角<rt>いっかく</rt></ruby>だった。</p>
<p><ruby>建物<rt>たてもの</rt></ruby>の<ruby>大半<rt>たいはん</rt></ruby>は<ruby>崩落<rt>ほうらく</rt></ruby>し、<ruby>蔵書<rt>ぞうしょ</rt></ruby>の<ruby>多<rt>おお</rt></ruby>くは<ruby>焼失<rt>しょうしつ</rt></ruby>していたが、<ruby>地下<rt>ちか</rt></ruby>の<ruby>防湿保管庫<rt>ぼうしつほかんこ</rt></ruby>に<ruby>収<rt>おさ</rt></ruby>められていた<ruby>写本<rt>しゃほん</rt></ruby>の<ruby>一部<rt>いちぶ</rt></ruby>が、<ruby>辛<rt>かろ</rt></ruby>うじて<ruby>難<rt>なん</rt></ruby>を<ruby>逃<rt>のが</rt></ruby>れた。</p>
<p><ruby>彼女<rt>かのじょ</rt></ruby>に<ruby>手伝<rt>てつだ</rt></ruby>いを<ruby>申<rt>もう</rt></ruby>し<ruby>出<rt>で</rt></ruby>た<ruby>若<rt>わか</rt></ruby>い<ruby>男<rt>おとこ</rt></ruby>は、かつてこの<ruby>図書館<rt>としょかん</rt></ruby>の<ruby>常連<rt>じょうれん</rt></ruby>だったと<ruby>言<rt>い</rt></ruby>った。「<ruby>子供<rt>こども</rt></ruby>の<ruby>頃<rt>ころ</rt></ruby>、<ruby>毎週<rt>まいしゅう</rt></ruby>ここに<ruby>来<rt>き</rt></ruby>て、<ruby>百科事典<rt>ひゃっかじてん</rt></ruby>を<ruby>端<rt>はし</rt></ruby>から<ruby>端<rt>はし</rt></ruby>まで<ruby>読<rt>よ</rt></ruby>もうとしていました。もちろん、<ruby>全部<rt>ぜんぶ</rt></ruby>は<ruby>読<rt>よ</rt></ruby>めませんでした」</p>
<p>「<ruby>今<rt>いま</rt></ruby>でも<ruby>遅<rt>おそ</rt></ruby>くはない」と<ruby>老婆<rt>ろうば</rt></ruby>は<ruby>応<rt>こた</rt></ruby>じた。「<ruby>図書館<rt>としょかん</rt></ruby>はなくならない。<ruby>人<rt>ひと</rt></ruby>が<ruby>本<rt>ほん</rt></ruby>を<ruby>必要<rt>ひつよう</rt></ruby>とする<ruby>限<rt>かぎ</rt></ruby>り、<ruby>必<rt>かなら</rt></ruby>ずどこかに<ruby>再<rt>ふたた</rt></ruby>び<ruby>現<rt>あらわ</rt></ruby>れる」</p>
<p><ruby>一年後<rt>いちねんご</rt></ruby>、<ruby>仮設<rt>かせつ</rt></ruby>の<ruby>図書館<rt>としょかん</rt></ruby>が<ruby>開館<rt>かいかん</rt></ruby>した。<ruby>蔵書<rt>ぞうしょ</rt></ruby>は<ruby>千冊<rt>せんさつ</rt></ruby>に<ruby>満<rt>み</rt></ruby>たなかったが、<ruby>開館<rt>かいかん</rt></ruby><ruby>初日<rt>しょにち</rt></ruby>には<ruby>百人<rt>ひゃくにん</rt></ruby>を<ruby>超<rt>こ</rt></ruby>える<ruby>人<rt>ひと</rt></ruby>が<ruby>訪<rt>おとず</rt></ruby>れた。</p>`,
    },
    {
      title: '言語の消滅',
      body: `<p><ruby>世界<rt>せかい</rt></ruby>では<ruby>平均<rt>へいきん</rt></ruby>して<ruby>二週間<rt>にしゅうかん</rt></ruby>に<ruby>一<rt>ひと</rt></ruby>つの<ruby>言語<rt>げんご</rt></ruby>が<ruby>消滅<rt>しょうめつ</rt></ruby>していると<ruby>言<rt>い</rt></ruby>われる。<ruby>話者<rt>わしゃ</rt></ruby>がいなくなり、<ruby>文字<rt>もじ</rt></ruby>に<ruby>記録<rt>きろく</rt></ruby>されることもなく、その<ruby>言語<rt>げんご</rt></ruby>とともに<ruby>消<rt>き</rt></ruby>えていく<ruby>世界観<rt>せかいかん</rt></ruby>や<ruby>概念<rt>がいねん</rt></ruby>の<ruby>体系<rt>たいけい</rt></ruby>は、<ruby>取<rt>と</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>しのつかない<ruby>形<rt>かたち</rt></ruby>で<ruby>失<rt>うしな</rt></ruby>われていく。</p>
<p><ruby>言語学者<rt>げんごがくしゃ</rt></ruby>の<ruby>梶川<rt>かじかわ</rt></ruby>はフィールドワークのため、<ruby>南米<rt>なんべい</rt></ruby>の<ruby>山岳地帯<rt>さんがくちたい</rt></ruby>に<ruby>向<rt>むか</rt></ruby>かった。<ruby>目的<rt>もくてき</rt></ruby>は、<ruby>話者<rt>わしゃ</rt></ruby>が<ruby>三人<rt>さんにん</rt></ruby>しか<ruby>残<rt>のこ</rt></ruby>っていないとされる<ruby>少数言語<rt>しょうすうげんご</rt></ruby>の<ruby>記録<rt>きろく</rt></ruby>だ。</p>
<p><ruby>最年長<rt>さいねんちょう</rt></ruby>の<ruby>話者<rt>わしゃ</rt></ruby>は<ruby>九十二歳<rt>きゅうじゅうにさい</rt></ruby>の<ruby>女性<rt>じょせい</rt></ruby>で、<ruby>彼女<rt>かのじょ</rt></ruby>の<ruby>息子<rt>むすこ</rt></ruby>も<ruby>娘<rt>むすめ</rt></ruby>も、もはやその<ruby>言語<rt>げんご</rt></ruby>を<ruby>日常的<rt>にちじょうてき</rt></ruby>には<ruby>使<rt>つか</rt></ruby>わない。</p>
<p>インタビューの<ruby>中<rt>なか</rt></ruby>で、<ruby>梶川<rt>かじかわ</rt></ruby>は<ruby>彼女<rt>かのじょ</rt></ruby>に「<ruby>悲<rt>かな</rt></ruby>しい」に<ruby>相当<rt>そうとう</rt></ruby>する<ruby>言葉<rt>ことば</rt></ruby>を<ruby>教<rt>おし</rt></ruby>えてもらった。しかしその<ruby>言葉<rt>ことば</rt></ruby>には、<ruby>日本語<rt>にほんご</rt></ruby>や<ruby>英語<rt>えいご</rt></ruby>の「<ruby>悲<rt>かな</rt></ruby>しい」とは<ruby>微妙<rt>びみょう</rt></ruby>に<ruby>異<rt>こと</rt></ruby>なるニュアンスが<ruby>含<rt>ふく</rt></ruby>まれていた。<ruby>愛<rt>あい</rt></ruby>するものが<ruby>存在<rt>そんざい</rt></ruby>したという<ruby>事実<rt>じじつ</rt></ruby>を<ruby>認識<rt>にんしき</rt></ruby>しながら、<ruby>同時<rt>どうじ</rt></ruby>にその<ruby>喪失<rt>そうしつ</rt></ruby>を<ruby>受<rt>う</rt></ruby>け<ruby>入<rt>い</rt></ruby>れるような、<ruby>複雑<rt>ふくざつ</rt></ruby>な<ruby>感情<rt>かんじょう</rt></ruby>を<ruby>一語<rt>いちご</rt></ruby>で<ruby>表現<rt>ひょうげん</rt></ruby>するのだという。</p>
<p>その<ruby>言葉<rt>ことば</rt></ruby>を<ruby>表現<rt>ひょうげん</rt></ruby>する<ruby>概念<rt>がいねん</rt></ruby>が、あと<ruby>数年<rt>すうねん</rt></ruby>で<ruby>人類<rt>じんるい</rt></ruby>の<ruby>語彙<rt>ごい</rt></ruby>から<ruby>永遠<rt>えいえん</rt></ruby>に<ruby>消<rt>き</rt></ruby>えてしまうことを、<ruby>梶川<rt>かじかわ</rt></ruby>は<ruby>静<rt>しず</rt></ruby>かに、しかし<ruby>深<rt>ふか</rt></ruby>く<ruby>悲<rt>かな</rt></ruby>しんだ。</p>`,
    },
  ],
};

let readerFurigana = false;
let readerCurrentSource = 'nhk';
let readerNhkArticles = null;

async function readerLoadSource() {
  const source = document.getElementById('reader-source').value;
  readerCurrentSource = source;
  readerBackToList();
  const listEl = document.getElementById('reader-article-list');
  listEl.innerHTML = '<p class="status-msg">Loading…</p>';
  if (source === 'nhk') {
    await readerLoadNhk(listEl);
  } else {
    readerLoadTadoku(source, listEl);
  }
}

async function readerLoadNhk(listEl) {
  const workerBase = (window.TSUNDOKU_CONFIG?.jishoApi || 'https://minireader.zoe-caudron.workers.dev/?keyword=')
    .replace('?keyword=', '');
  try {
    const r = await fetch(workerBase + '?nhk=1', { signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error('Worker returned ' + r.status);
    const data = await r.json();
    if (!data.articles?.length) throw new Error('No articles');
    readerNhkArticles = data.articles;
    readerLastFetch = Date.now();
    listEl.innerHTML = '';
    for (const article of data.articles) {
      const btn = document.createElement('button');
      btn.className = 'reader-article-btn';
      const titleText = article.title || 'Article ' + article.id;
      const imgHtml = article.img
        ? `<img class="reader-article-thumb" src="${escapeHtml(article.img)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : '';
      btn.innerHTML = `
        ${imgHtml}
        <span class="reader-article-info">
          <span class="reader-article-title">${escapeHtml(titleText)}</span>
          ${article.date ? `<span class="reader-article-date">${escapeHtml(article.date)}</span>` : ''}
        </span>`;
      btn.addEventListener('click', () => readerOpenNhkArticle(article));
      listEl.appendChild(btn);
    }
  } catch (e) {
    listEl.innerHTML = `
      <div style="padding:16px">
        <p class="status-msg" style="margin-bottom:12px">⚠ Couldn't load NHK Easy News.</p>
        <p style="font-size:0.85rem;opacity:0.7">You can read NHK Easy News directly at
        <a href="https://nhkeasier.com/" target="_blank" rel="noreferrer" style="color:var(--accent-stroke)">nhkeasier.com ↗</a>
        or <a href="https://www3.nhk.or.jp/news/easy/" target="_blank" rel="noreferrer" style="color:var(--accent-stroke)">nhk.or.jp/news/easy ↗</a></p>
      </div>`;
  }
}

async function readerOpenNhkArticle(article) {
  document.getElementById('reader-article-list').style.display = 'none';
  const contentEl = document.getElementById('reader-content');
  contentEl.style.display = 'block';
  document.getElementById('reader-article-title').textContent = article.title;
  const bodyEl = document.getElementById('reader-body');

  // Body is now pre-fetched from nhkeasier.com and included in the article object
  if (article.body) {
    bodyEl.innerHTML = article.body;
    readerApplyFurigana(readerFurigana);
  } else {
    // Fallback: try fetching from worker (shouldn't normally happen)
    const workerBase = (window.TSUNDOKU_CONFIG?.jishoApi || 'https://minireader.zoe-caudron.workers.dev/?keyword=')
      .replace('?keyword=', '');
    bodyEl.innerHTML = '<p class="status-msg">Loading article…</p>';
    try {
      const r = await fetch(workerBase + '?nhk_article=' + encodeURIComponent(article.url), {
        signal: AbortSignal.timeout(12000)
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      bodyEl.innerHTML = data.html || '<p class="status-msg">No content found.</p>';
      readerApplyFurigana(readerFurigana);
    } catch (e) {
      const link = article.url || 'https://nhkeasier.com/';
      bodyEl.innerHTML = `<p class="status-msg">Failed to load article. <a href="${escapeHtml(link)}" target="_blank" rel="noreferrer" style="color:var(--accent-stroke)">Open on NHK Easier ↗</a></p>`;
    }
  }
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
}

function readerLoadTadoku(source, listEl) {
  const allStories = TADOKU_STORIES[source] || [];
  // Rotate: each week show a different story first (cycles through all stories)
  const weekOffset = getWeekNumber() % Math.max(allStories.length, 1);
  const stories = [
    ...allStories.slice(weekOffset),
    ...allStories.slice(0, weekOffset),
  ];
  if (!stories.length) { listEl.innerHTML = '<p class="status-msg">No stories available.</p>'; return; }
  listEl.innerHTML = '';
  for (const story of stories) {
    const btn = document.createElement('button');
    btn.className = 'reader-article-btn';
    btn.innerHTML = `<span class="reader-article-title">${escapeHtml(story.title)}</span>`;
    btn.addEventListener('click', () => readerOpenTadokuStory(story));
    listEl.appendChild(btn);
  }
}

function readerOpenTadokuStory(story) {
  document.getElementById('reader-article-list').style.display = 'none';
  const contentEl = document.getElementById('reader-content');
  contentEl.style.display = 'block';
  document.getElementById('reader-article-title').textContent = story.title;
  document.getElementById('reader-body').innerHTML = story.body;
  readerApplyFurigana(readerFurigana);
}

function readerToggleFurigana(show) {
  readerFurigana = show;
  readerApplyFurigana(show);
}

function readerApplyFurigana(show) {
  const body = document.getElementById('reader-body');
  if (!body) return;
  body.querySelectorAll('rt').forEach(rt => {
    rt.style.visibility = show ? '' : 'hidden';
  });
}

function readerBackToList() {
  document.getElementById('reader-content').style.display = 'none';
  document.getElementById('reader-article-list').style.display = '';
}

let readerLastFetch = 0;

function initReader() {
  // Refetch if stale (>30 min) or never fetched
  const stale = Date.now() - readerLastFetch > 30 * 60 * 1000;
  if (readerNhkArticles !== null && !stale) return;
  readerNhkArticles = null;
  readerLoadSource();
}

// Expose globals
window.readerLoadSource     = readerLoadSource;
window.readerToggleFurigana = readerToggleFurigana;
window.readerBackToList     = readerBackToList;
window.initReader           = initReader;

document.addEventListener('DOMContentLoaded', () => {
  const tog = document.getElementById('furigana-toggle');
  if (tog) { tog.checked = readerFurigana; }
});

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g,
    m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
