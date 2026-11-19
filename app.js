/* kredit-maliki: Template oleh Maliki Saputra (@malikisaputra) — https://malikisaputra.biz.id. Lisensi Nonkomersial Maliki Studio: wajib kredit, dilarang dijual (lihat LICENSE). */
/* Keuangan Pribadi — HTML/CSS/JS murni, data per akun Supabase. */
(function () {
  'use strict';

  // ---------- Utilitas ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var VERSI = 1;
  var PARAM = new URLSearchParams(location.search);
  var DEMO = PARAM.has('demo');
  var GERAK = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NAMA_TEMA = (window.TEMA && TEMA.nama) || 'Catatan Keuangan';
  // ---------- Logo & foto (SATU tempat pengaturan gambar) ----------
  // Avatar diunggah di menu Atur,
  // diperkecil ke GAMBAR.maks px lalu disimpan sebagai dataURL (ikut cadangan .json).
  var GAMBAR = { maks: 400, ikonBawaan: 'dompet' };
  function kecilkan(file, cb) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var s = Math.min(1, GAMBAR.maks / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); var png = c.toDataURL('image/png'); cb(png.length > 300000 ? c.toDataURL('image/jpeg', 0.8) : png);
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast('Gambar tidak bisa dibaca'); };
    img.src = url;
  }
  function gambarAman(s) { return /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s || ''); }
  function inisial(s) { return String(s || '?').trim().split(/\s+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase() || '?'; }
  // <img> dengan cadangan inisial bila gagal dimuat (ditangani pendengar 'error' di bawah)
  function gbr(src, nama, cls) { return '<img class="' + (cls || '') + '" src="' + esc(src) + '" alt="" data-inisial="' + esc(inisial(nama)) + '">'; }
  window.addEventListener('error', function (e) {
    var t = e.target; if (t && t.tagName === 'IMG' && t.dataset.inisial) { var s = document.createElement('b'); s.className = 'ini'; s.textContent = t.dataset.inisial; t.replaceWith(s); }
  }, true);
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var BLN = BULAN.map(function (b) { return b.slice(0, 3); });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rp(n, tanda) { n = Math.round(n || 0); var s = 'Rp' + Math.abs(n).toLocaleString('id-ID'); return n < 0 ? '−' + s : (tanda && n > 0 ? '+' + s : s); }
  function rpPendek(n) { var a = Math.abs(n); if (a >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + 'M'; if (a >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + 'jt'; if (a >= 1e3) return Math.round(n / 1e3) + 'rb'; return String(n); }
  function angkaDari(s) { return parseInt(String(s || '').replace(/[^\d]/g, ''), 10) || 0; }
  function idBaru() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tglISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hariIni() { return tglISO(new Date()); }
  function tglTampil(s, pendek) { var p = s.split('-'); return (+p[2]) + ' ' + (pendek ? BLN : BULAN)[+p[1] - 1] + ' ' + p[0]; }
  function bulanKey(s) { return s.slice(0, 7); }
  function bulanLabel(k) { var p = k.split('-'); return BULAN[+p[1] - 1] + ' ' + p[0]; }
  function geserBulan(k, n) { var p = k.split('-'), d = new Date(+p[0], +p[1] - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }

  // ---------- Data ----------
  // Ikon kategori tersedia (id simbol SVG di index.html)
  var IKON = ['makan', 'motor', 'keranjang', 'petir', 'sehat', 'hibur', 'sedekah', 'topi', 'rumah', 'koper', 'hadiah', 'toko', 'kotak', 'palu', 'air', 'sapu', 'masjid', 'orang', 'titik'];
  var WARNA = ['#e8b04a', '#5aa7d6', '#d97757', '#8f7ad9', '#e06a8a', '#4fb38a', '#c9a227', '#6f9bd1', '#9a8f7a', '#3fa7a0', '#b47ad1', '#7aa35a'];

  function dataKosong() {
    return {
      versi: VERSI,
      pribadi: {
        dompet: [{ id: 'tunai', nama: 'Tunai', jenis: 'tunai', saldoAwal: 0 }, { id: 'bank', nama: 'Rekening Bank', jenis: 'bank', saldoAwal: 0 }, { id: 'ewallet', nama: 'E-wallet', jenis: 'ewallet', saldoAwal: 0 }],
        kategori: [
          { id: 'makan', nama: 'Makan & Minum', ikon: 'makan', warna: WARNA[0], jenis: 'keluar', anggaran: 0 },
          { id: 'transport', nama: 'Transportasi', ikon: 'motor', warna: WARNA[1], jenis: 'keluar', anggaran: 0 },
          { id: 'belanja', nama: 'Belanja Bulanan', ikon: 'keranjang', warna: WARNA[2], jenis: 'keluar', anggaran: 0 },
          { id: 'tagihan', nama: 'Tagihan & Pulsa', ikon: 'petir', warna: WARNA[3], jenis: 'keluar', anggaran: 0 },
          { id: 'sehat', nama: 'Kesehatan', ikon: 'sehat', warna: WARNA[4], jenis: 'keluar', anggaran: 0 },
          { id: 'hibur', nama: 'Hiburan', ikon: 'hibur', warna: WARNA[5], jenis: 'keluar', anggaran: 0 },
          { id: 'sedekah', nama: 'Sedekah & Zakat', ikon: 'sedekah', warna: WARNA[6], jenis: 'keluar', anggaran: 0 },
          { id: 'didik', nama: 'Pendidikan', ikon: 'topi', warna: WARNA[7], jenis: 'keluar', anggaran: 0 },
          { id: 'lain-k', nama: 'Lainnya', ikon: 'titik', warna: WARNA[8], jenis: 'keluar', anggaran: 0 },
          { id: 'gaji', nama: 'Gaji', ikon: 'koper', warna: WARNA[9], jenis: 'masuk', anggaran: 0 },
          { id: 'sampingan', nama: 'Usaha Sampingan', ikon: 'toko', warna: WARNA[10], jenis: 'masuk', anggaran: 0 },
          { id: 'lain-m', nama: 'Pemasukan Lain', ikon: 'hadiah', warna: WARNA[11], jenis: 'masuk', anggaran: 0 }
        ],
        transaksi: [], target: [], nama: '', avatar: ''
      }
    };
  }

  // Generator acak berbenih supaya data contoh selalu sama
  function acak(benih) { return function () { benih = (benih * 9301 + 49297) % 233280; return benih / 233280; }; }

  function dataContoh() {
    var D = dataKosong(), r = acak(42), now = new Date(), P = D.pribadi;
    P.dompet = [
      { id: 'tunai', nama: 'Tunai', jenis: 'tunai', saldoAwal: 1200000 },
      { id: 'bank', nama: 'BCA Tabungan', jenis: 'bank', saldoAwal: 2400000 },
      { id: 'ewallet', nama: 'GoPay', jenis: 'ewallet', saldoAwal: 300000 }
    ];
    var ang = { makan: 1800000, transport: 600000, belanja: 1200000, tagihan: 750000, sehat: 300000, hibur: 400000, sedekah: 350000, didik: 500000 };
    P.kategori.forEach(function (k) { if (ang[k.id]) k.anggaran = ang[k.id]; });
    var T = P.transaksi;
    function tx(d, jenis, jumlah, kat, dompet, ket) { if (d > now) return; T.push({ id: idBaru() + T.length, t: tglISO(d), jenis: jenis, jumlah: jumlah, kat: kat, dompet: dompet, ket: ket }); }
    var warung = ['Nasi padang', 'Warteg dekat kantor', 'Kopi susu', 'Bakso Pak Kumis', 'Ayam geprek', 'Martabak manis', 'Soto Lamongan', 'Gado-gado'];
    for (var m = 5; m >= 0; m--) {
      var y = now.getFullYear(), bl = now.getMonth() - m;
      var d0 = function (h) { return new Date(y, bl, h); };
      tx(d0(1), 'masuk', 7250000, 'gaji', 'bank', 'Gaji bulanan PT Sinar Kreasi');
      if (m % 2 === 0) tx(d0(14), 'masuk', 850000 + Math.round(r() * 6) * 100000, 'sampingan', 'ewallet', 'Jualan kue kering online');
      T.push({ id: idBaru() + T.length, t: tglISO(d0(1)), jenis: 'pindah', jumlah: 600000, dompet: 'bank', ke: 'ewallet', ket: 'Isi saldo GoPay' });
      T.push({ id: idBaru() + T.length, t: tglISO(d0(2)), jenis: 'pindah', jumlah: 500000, dompet: 'bank', ke: 'tunai', ket: 'Tarik tunai ATM' });
      tx(d0(2), 'keluar', 750000, 'tagihan', 'bank', 'Listrik, internet & pulsa');
      tx(d0(3), 'keluar', 350000, 'sedekah', 'bank', 'Infak & sedekah Jumat');
      tx(d0(5), 'keluar', 980000 + Math.round(r() * 3) * 50000, 'belanja', 'bank', 'Belanja bulanan di pasar');
      if (m % 3 === 1) tx(d0(18), 'keluar', 250000, 'sehat', 'tunai', 'Periksa ke klinik');
      tx(d0(20), 'keluar', 450000, 'didik', 'bank', 'Kursus bahasa Inggris');
      for (var h = 1; h <= 28; h += 1 + Math.floor(r() * 2)) {
        tx(d0(h), 'keluar', (15 + Math.round(r() * 45)) * 1000, 'makan', (function (x) { return x > 0.8 ? 'tunai' : x > 0.45 ? 'ewallet' : 'bank'; })(r()), warung[Math.floor(r() * warung.length)]);
        if (r() > 0.55) tx(d0(h), 'keluar', (10 + Math.round(r() * 25)) * 1000, 'transport', 'ewallet', r() > 0.5 ? 'Ojek online' : 'Bensin motor');
      }
      tx(d0(22), 'keluar', 120000 + Math.round(r() * 4) * 40000, 'hibur', 'ewallet', 'Nonton & langganan musik');
    }
    P.target = [
      { id: 't1', nama: 'Dana darurat', target: 15000000, terkumpul: 6400000, ikon: 'sehat' },
      { id: 't2', nama: 'Mudik Lebaran', target: 4000000, terkumpul: 1750000, ikon: 'motor' },
      { id: 't3', nama: 'Laptop baru', target: 9000000, terkumpul: 2100000, ikon: 'koper' }
    ];

    return D;
  }

  var D;
  var klien, sesiAktif, kondisi;
  function dataPribadi(data) {
    var pribadi = data && data.pribadi;
    if (!pribadi || !Array.isArray(pribadi.transaksi)) throw new Error('Format cadangan');
    var hasil = dataKosong();
    Object.keys(hasil.pribadi).forEach(function (kunci) {
      if (Object.hasOwn(pribadi, kunci)) hasil.pribadi[kunci] = pribadi[kunci];
    });
    var idAman = /^[a-zA-Z0-9_-]{1,100}$/;
    ['transaksi', 'dompet', 'kategori', 'target'].forEach(function (kunci) {
      var daftar = hasil.pribadi[kunci];
      if (!Array.isArray(daftar) || !daftar.every(function (item) {
        return item && typeof item.id === 'string' && idAman.test(item.id);
      }) || new Set(daftar.map(function (item) { return item.id; })).size !== daftar.length) {
        throw new Error('Format cadangan');
      }
    });
    if (!hasil.pribadi.transaksi.every(function (t) {
      return typeof t.t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.t) &&
        ['masuk', 'keluar', 'pindah'].includes(t.jenis) && Number.isSafeInteger(t.jumlah) && t.jumlah > 0;
    })) throw new Error('Format transaksi');
    hasil.pribadi.kategori.forEach(function (k) {
      if (!IKON.includes(k.ikon)) k.ikon = 'titik';
      if (!/^#[\da-f]{3}([\da-f]{3})?$/i.test(k.warna)) k.warna = WARNA[0];
    });
    hasil.pribadi.target.forEach(function (t) {
      if (t.ikon !== 'target' && !IKON.includes(t.ikon)) t.ikon = 'target';
    });
    return hasil;
  }

  function statusSimpan(teks, galat, konflik) {
    $('#pitaSimpan').hidden = !teks;
    $('#statusSimpan').textContent = teks;
    $('#ulangSimpan').hidden = !galat || konflik;
    $('#cadangPerubahan').hidden = !galat;
  }

  function simpan() {
    if (DEMO || !kondisi) return;
    kondisi.draf = JSON.stringify(P());
    if (!kondisi.konflik) kirimSimpanan(kondisi);
  }

  async function kirimSimpanan(akun) {
    if (akun !== kondisi || akun.mengirim || akun.draf === null || akun.konflik) return;
    akun.mengirim = true;
    statusSimpan('Menyimpan perubahan…');
    try {
      while (akun === kondisi && akun.draf !== null) {
        var draf = akun.draf;
        var hasil = await klien.rpc('simpan_pribadi', {
          pemilik_diharapkan: akun.id,
          revisi_awal: akun.revisi,
          data_pribadi: JSON.parse(draf)
        });
        if (hasil.error) throw hasil.error;
        akun.revisi = hasil.data;
        if (akun.draf === draf) akun.draf = null;
      }
      if (akun === kondisi) statusSimpan('Perubahan tersimpan di akunmu.');
    } catch (e) {
      akun.konflik = e.code === 'PT409';
      if (akun === kondisi) statusSimpan(akun.konflik ?
        'Data akun berubah di sesi lain. Unduh cadangan perubahan ini sebelum memuat ulang.' :
        'Perubahan belum tersimpan. Periksa koneksi, lalu coba simpan lagi.', true, akun.konflik);
    } finally {
      akun.mengirim = false;
    }
  }

  // ---------- Hitungan ----------
  function P() { return D.pribadi; }
  function kat(id) { return P().kategori.filter(function (k) { return k.id === id; })[0] || { nama: 'Tanpa kategori', ikon: 'titik', warna: '#999', jenis: 'keluar' }; }
  function dompet(id) { return P().dompet.filter(function (k) { return k.id === id; })[0] || { nama: '—', jenis: 'tunai', saldoAwal: 0 }; }
  function saldoDompet(id) { var s = dompet(id).saldoAwal || 0; P().transaksi.forEach(function (t) { if (t.jenis === 'pindah') { if (t.dompet === id) s -= t.jumlah; if (t.ke === id) s += t.jumlah; } else if (t.dompet === id) s += t.jenis === 'masuk' ? t.jumlah : -t.jumlah; }); return s; }
  function totalSaldo() { return P().dompet.reduce(function (a, d) { return a + saldoDompet(d.id); }, 0); }
  function sumBulan(k, jenis, katId) { return P().transaksi.reduce(function (a, t) { return a + (bulanKey(t.t) === k && t.jenis === jenis && (!katId || t.kat === katId) ? t.jumlah : 0); }, 0); }

  // ---------- Navigasi ----------
  var MENU = [['beranda', 'Beranda', 'rumah'], ['transaksi', 'Transaksi', 'daftar'], ['anggaran', 'Anggaran', 'donat'], ['tabungan', 'Tabungan', 'target'], ['laporan', 'Laporan', 'grafik'], ['atur', 'Atur', 'atur']];

  var halAktif = null;
  function renderMerek() {
    var src = P().avatar, nama = P().nama || NAMA_TEMA;
    var el = $('.merek .logo'); if (!el) return;
    el.classList.toggle('pakai-foto', gambarAman(src));
    el.innerHTML = gambarAman(src) ? gbr(src, nama) : '<svg><use href="#i-' + GAMBAR.ikonBawaan + '"/></svg>';
  }
  function renderMenu() {
    var items = MENU;
    var html = items.map(function (m) { return '<button class="nav" type="button" data-hal="' + m[0] + '"><svg aria-hidden="true"><use href="#i-' + m[2] + '"/></svg><span>' + m[1] + '</span></button>'; }).join('');
    $('#menu').innerHTML = html;
    $('#bawah').innerHTML = items.filter(function (m) { return m[0] !== 'tabungan'; }).map(function (m) { return '<button class="nav" type="button" data-hal="' + m[0] + '"><svg aria-hidden="true"><use href="#i-' + m[2] + '"/></svg><span>' + m[1] + '</span></button>'; }).join('');
    renderMerek();
  }
  function buka(h, tanpaFokus) {
    var ada = MENU.some(function (m) { return m[0] === h; });
    if (!ada) h = MENU[0][0];
    halAktif = h;
    $$('.nav').forEach(function (b) { var on = b.getAttribute('data-hal') === h; b.classList.toggle('aktif', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    var el = $('#hal');
    el.innerHTML = '<section class="halaman" aria-labelledby="judulHal">' + (RENDER[h] || RENDER.beranda)() + '</section>';
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#' + h);
    pasangHal();
    hitungNaik();
    if (!tanpaFokus) { var j = $('#judulHal'); if (j) { j.setAttribute('tabindex', '-1'); j.focus({ preventScroll: true }); } window.scrollTo({ top: 0, behavior: GERAK ? 'smooth' : 'auto' }); }
  }
  function ulang() { buka(halAktif, true); }

  function kepala(judul, sub, aksi) {
    return '<header class="kepala"><div><p class="sapa">' + sub + '</p><h1 id="judulHal" data-bagian="teks">' + judul + '</h1></div>' + (aksi || '') + '</header>';
  }
  function ikon(n, warna, cls) { return '<span class="ikon ' + (cls || '') + '" style="--w:' + (warna || 'var(--utama)') + '" aria-hidden="true"><svg><use href="#i-' + n + '"/></svg></span>'; }
  function kosong(teks, sub) { return '<div class="kosong"><svg aria-hidden="true"><use href="#i-kosong"/></svg><b>' + teks + '</b><span>' + sub + '</span></div>'; }
  function angka(n, cls) { return '<span class="hitung ' + (cls || '') + '" data-n="' + Math.round(n) + '">' + rp(n) + '</span>'; }
  function sapaan() { var j = new Date().getHours(); return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam'; }

  // Cincin progres SVG
  function cincin(persen, warna, ukuran) {
    var u = ukuran || 56, r = u / 2 - 5, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, persen));
    return '<svg class="cincin" style="width:' + u + 'px;height:' + u + 'px" viewBox="0 0 ' + u + ' ' + u + '" aria-hidden="true"><circle cx="' + u / 2 + '" cy="' + u / 2 + '" r="' + r + '" class="jalur"/><circle cx="' + u / 2 + '" cy="' + u / 2 + '" r="' + r + '" class="isi" style="stroke:' + warna + ';--c:' + c.toFixed(1) + ';--o:' + (c * (1 - p)).toFixed(1) + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - p)).toFixed(1) + '"/></svg>';
  }
  // Donat kategori
  function donat(bagian, tengah, label) {
    var tot = bagian.reduce(function (a, b) { return a + b.n; }, 0) || 1, r = 70, c = 2 * Math.PI * r, off = 0;
    var seg = bagian.map(function (b, i) {
      var pj = b.n / tot * c, s = '<circle cx="90" cy="90" r="' + r + '" stroke="' + b.w + '" stroke-dasharray="' + Math.max(0, pj - 2).toFixed(1) + ' ' + c.toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" style="--i:' + i + '"><title>' + esc(b.nama) + ': ' + rp(b.n) + '</title></circle>';
      off += pj; return s;
    }).join('');
    return '<div class="donat"><svg viewBox="0 0 180 180" role="img" aria-label="' + esc(label) + '"><circle cx="90" cy="90" r="' + r + '" class="jalur"/>' + seg + '</svg><div class="donat-tengah"><small>' + tengah[0] + '</small><b>' + tengah[1] + '</b></div></div>';
  }
  // Grafik batang masuk vs keluar
  function grafikBatang(data, label) {
    var maks = Math.max.apply(null, data.map(function (d) { return Math.max(d.m, d.k); }).concat([1]));
    return '<div class="batang" role="img" aria-label="' + esc(label) + '">' + data.map(function (d, i) {
      return '<div class="kol' + (d.aktif ? ' aktif' : '') + '"><div class="pasang"><i class="m" style="--h:' + (d.m / maks * 100).toFixed(1) + '%;--i:' + i + '" title="Masuk ' + rp(d.m) + '"></i><i class="k" style="--h:' + (d.k / maks * 100).toFixed(1) + '%;--i:' + i + '" title="Keluar ' + rp(d.k) + '"></i></div><span>' + d.l + '</span></div>';
    }).join('') + '</div><div class="legenda"><span><i class="m"></i>Pemasukan</span><span><i class="k"></i>Pengeluaran</span></div>';
  }

  // ---------- PRIBADI ----------
  var bulanPilih = hariIni().slice(0, 7);
  var filterTxAwal = { q: '', jenis: '', kat: '' };
  var filterTx = Object.assign({}, filterTxAwal);

  function barisTx(t, i) {
    if (t.jenis === 'pindah') return '<li style="--i:' + Math.min(i, 14) + '"><button type="button" class="baris" data-pindah="' + t.id + '">' + ikon('tukar', 'var(--redup)') + '<span class="isi"><b>' + esc(t.ket || 'Pindah saldo') + '</b><small>' + esc(dompet(t.dompet).nama) + ' → ' + esc(dompet(t.ke).nama) + ' · ' + tglTampil(t.t, true) + '</small></span><span class="nilai">' + rp(t.jumlah) + '</span></button></li>';
    var k = kat(t.kat), d = dompet(t.dompet);
    return '<li style="--i:' + Math.min(i, 14) + '"><button type="button" class="baris" data-tx="' + t.id + '">' + ikon(k.ikon, k.warna) +
      '<span class="isi"><b>' + esc(t.ket || k.nama) + '</b><small>' + esc(k.nama) + ' · ' + esc(d.nama) + ' · ' + tglTampil(t.t, true) + '</small></span>' +
      '<span class="nilai ' + t.jenis + '">' + (t.jenis === 'masuk' ? '+' : '−') + rp(t.jumlah).replace('Rp', 'Rp') + '</span></button></li>';
  }
  function urutTx(a) { return a.slice().sort(function (x, y) { return x.t < y.t ? 1 : x.t > y.t ? -1 : (x.id < y.id ? 1 : -1); }); }
  function ikonDompet(j) { return j === 'bank' ? 'bank' : j === 'ewallet' ? 'hp' : 'tunai'; }

  var RENDER = {};
  RENDER.beranda = function () {
    var bk = hariIni().slice(0, 7), masuk = sumBulan(bk, 'masuk'), keluar = sumBulan(bk, 'keluar'), lalu = sumBulan(geserBulan(bk, -1), 'keluar');
    var beda = lalu ? Math.round((keluar - lalu) / lalu * 100) : 0;
    var dompetHtml = P().dompet.map(function (d, i) { return '<button type="button" class="dompet" data-dompet="' + d.id + '" style="--i:' + i + '">' + ikon(ikonDompet(d.jenis), 'var(--aksen)', 'kecil') + '<span><small>' + esc(d.nama) + '</small><b>' + rp(saldoDompet(d.id)) + '</b></span></button>'; }).join('');
    var angg = P().kategori.filter(function (k) { return k.jenis === 'keluar' && k.anggaran > 0; }).map(function (k) { return { k: k, p: sumBulan(bk, 'keluar', k.id) }; }).sort(function (a, b) { return b.p / b.k.anggaran - a.p / a.k.anggaran; }).slice(0, 4);
    var anggHtml = angg.length ? angg.map(function (a, i) { var ps = a.p / a.k.anggaran; return '<div class="ring-kartu' + (ps > 1 ? ' lewat' : '') + '" style="--i:' + i + '"><div class="ring-wadah">' + cincin(ps, ps > 1 ? 'var(--rugi)' : a.k.warna, 64) + '<span class="ring-ikon" style="--w:' + a.k.warna + '"><svg><use href="#i-' + a.k.ikon + '"/></svg></span></div><b>' + esc(a.k.nama) + '</b><small>' + Math.round(ps * 100) + '% · sisa ' + rp(Math.max(0, a.k.anggaran - a.p)) + '</small></div>'; }).join('') : kosong('Belum ada anggaran', 'Atur batas belanja di menu Anggaran.');
    var akhir = urutTx(P().transaksi).slice(0, 6);
    return kepala(sapaan(), tglTampil(hariIni()), '<button class="tombol utama sembunyi-hp" type="button" data-aksi="tambah" data-bagian="utama"><svg><use href="#i-plus"/></svg><span>Catat transaksi</span></button>') +
      '<div class="grid-beranda">' +
      '<article class="saldo-kartu" data-bagian="utama"><div class="saldo-atas"><span>Total saldo</span><span class="chip-bulan">' + bulanLabel(bk) + '</span></div>' +
      '<p class="saldo-angka">' + angka(totalSaldo()) + '</p>' +
      '<div class="saldo-bawah"><div><small><svg><use href="#i-naik"/></svg>Pemasukan</small><b>' + rp(masuk) + '</b></div><div><small><svg><use href="#i-turun"/></svg>Pengeluaran</small><b>' + rp(keluar) + '</b></div></div>' +
      '<svg class="saldo-hias" viewBox="0 0 200 200" aria-hidden="true"><circle cx="160" cy="40" r="70"/><circle cx="190" cy="150" r="46"/></svg></article>' +
      '<div class="dompet-grid">' + dompetHtml + '<button type="button" class="dompet pindah-btn" data-aksi="pindah" style="--i:' + P().dompet.length + '">' + ikon('tukar', 'var(--utama)', 'kecil') + '<span><small>Antar dompet</small><b>Pindah saldo</b></span></button></div>' +
      '<article class="panel" data-bagian="panel"><div class="judul-panel"><h2>Anggaran bulan ini</h2><button type="button" class="tautan" data-ke="anggaran">Lihat semua</button></div><div class="ring-grid">' + anggHtml + '</div>' +
      '<p class="catatan-kecil">' + (lalu ? 'Pengeluaran ' + (beda >= 0 ? 'naik ' : 'turun ') + Math.abs(beda) + '% dibanding ' + bulanLabel(geserBulan(bk, -1)) + ' (bulan lalu penuh).' : '') + '</p></article>' +
      '<article class="panel" data-bagian="panel"><div class="judul-panel"><h2>Transaksi terakhir</h2><button type="button" class="tautan" data-ke="transaksi">Semua</button></div>' +
      (akhir.length ? '<ul class="daftar">' + akhir.map(barisTx).join('') + '</ul>' : kosong('Belum ada transaksi', 'Tekan tombol + untuk mencatat yang pertama.')) + '</article>' +
      '</div>';
  };

  RENDER.transaksi = function () {
    var daftar = urutTx(P().transaksi).filter(function (t) {
      if (bulanKey(t.t) !== bulanPilih) return false;
      if (filterTx.jenis && t.jenis !== filterTx.jenis) return false;
      if (filterTx.kat && t.kat !== filterTx.kat) return false;
      if (filterTx.q && (t.ket + ' ' + kat(t.kat).nama).toLowerCase().indexOf(filterTx.q.toLowerCase()) < 0) return false;
      return true;
    });
    var grup = {}, urut = [];
    daftar.forEach(function (t) { if (!grup[t.t]) { grup[t.t] = []; urut.push(t.t); } grup[t.t].push(t); });
    var m = daftar.reduce(function (a, t) { return a + (t.jenis === 'masuk' ? t.jumlah : 0); }, 0), k = daftar.reduce(function (a, t) { return a + (t.jenis === 'keluar' ? t.jumlah : 0); }, 0);
    var opsKat = '<option value="">Semua kategori</option>' + P().kategori.map(function (c) { return '<option value="' + c.id + '"' + (filterTx.kat === c.id ? ' selected' : '') + '>' + esc(c.nama) + '</option>'; }).join('');
    var n = 0;
    return kepala('Transaksi', 'Catatan harian', pemilihBulan()) +
      '<div class="ringkas3"><div><small>Masuk</small><b class="masuk">' + rp(m) + '</b></div><div><small>Keluar</small><b class="keluar">' + rp(k) + '</b></div><div><small>Selisih</small><b>' + rp(m - k) + '</b></div></div>' +
      '<div class="saring" data-bagian="panel"><label class="cari"><svg aria-hidden="true"><use href="#i-cari"/></svg><span class="sr">Cari transaksi</span><input id="qTx" type="search" placeholder="Cari catatan…" value="' + esc(filterTx.q) + '"></label>' +
      '<div class="segmen" role="group" aria-label="Jenis">' + [['', 'Semua'], ['masuk', 'Masuk'], ['keluar', 'Keluar']].map(function (j) { return '<button type="button" data-jenis-f="' + j[0] + '" aria-pressed="' + (filterTx.jenis === j[0]) + '">' + j[1] + '</button>'; }).join('') + '</div>' +
      '<label class="sr" for="katF">Kategori</label><select id="katF">' + opsKat + '</select>' +
      '<button class="tombol garis" type="button" data-aksi="csv-pribadi"><svg><use href="#i-unduh"/></svg><span>CSV</span></button></div>' +
      (urut.length ? urut.map(function (t) {
        var sub = grup[t].reduce(function (a, x) { return a + (x.jenis === 'masuk' ? x.jumlah : x.jenis === 'keluar' ? -x.jumlah : 0); }, 0);
        return '<article class="panel grup" data-bagian="panel"><div class="grup-kepala"><b>' + tglTampil(t) + '</b><span class="' + (sub >= 0 ? 'masuk' : 'keluar') + '">' + rp(sub, true) + '</span></div><ul class="daftar">' + grup[t].map(function (x) { return barisTx(x, n++); }).join('') + '</ul></article>';
      }).join('') : '<article class="panel" data-bagian="panel">' + kosong('Tidak ada transaksi', 'Coba ganti bulan atau hapus saringan.') + '</article>');
  };

  function pemilihBulan() {
    return '<div class="pilih-bulan" role="group" aria-label="Pilih bulan"><button type="button" class="ikon-btn" data-bulan="-1" aria-label="Bulan sebelumnya"><svg><use href="#i-kiri"/></svg></button><b aria-live="polite">' + bulanLabel(bulanPilih) + '</b><button type="button" class="ikon-btn" data-bulan="1" aria-label="Bulan berikutnya"' + (bulanPilih >= hariIni().slice(0, 7) ? ' disabled' : '') + '><svg><use href="#i-kanan"/></svg></button></div>';
  }

  RENDER.anggaran = function () {
    var ks = P().kategori.filter(function (k) { return k.jenis === 'keluar'; });
    var totA = 0, totP = 0;
    var kartu = ks.map(function (k, i) {
      var p = sumBulan(bulanPilih, 'keluar', k.id), a = k.anggaran || 0, ps = a ? p / a : 0; totA += a; totP += a ? p : 0;
      var status = !a ? 'Belum diatur' : ps > 1 ? 'Lewat ' + rp(p - a) : ps > 0.85 ? 'Hampir habis' : 'Aman';
      return '<button type="button" class="angg-kartu' + (ps > 1 ? ' lewat' : ps > .85 ? ' waspada' : '') + '" data-angg="' + k.id + '" style="--i:' + i + '" data-bagian="panel">' +
        '<div class="ring-wadah">' + cincin(ps, ps > 1 ? 'var(--rugi)' : k.warna, 76) + '<span class="ring-ikon" style="--w:' + k.warna + '"><svg><use href="#i-' + k.ikon + '"/></svg></span></div>' +
        '<span class="isi"><b>' + esc(k.nama) + '</b><small>' + rp(p) + (a ? ' dari ' + rp(a) : '') + '</small><span class="pil-status">' + status + '</span></span></button>';
    }).join('');
    var ps = totA ? totP / totA : 0;
    return kepala('Anggaran', 'Batas belanja per kategori', pemilihBulan()) +
      '<article class="panel angg-total" data-bagian="panel"><div class="ring-wadah besar">' + cincin(ps, ps > 1 ? 'var(--rugi)' : 'var(--utama)', 132) + '<span class="ring-teks"><b>' + Math.round(ps * 100) + '%</b><small>terpakai</small></span></div>' +
      '<div><h2>Total anggaran ' + bulanLabel(bulanPilih) + '</h2><p class="besar">' + rp(totP) + ' <small>dari ' + rp(totA) + '</small></p><p class="redup">Sisa ' + rp(Math.max(0, totA - totP)) + '. Ketuk kartu kategori untuk mengubah batasnya.</p></div></article>' +
      '<div class="angg-grid">' + kartu + '</div>' +
      '<button type="button" class="tombol garis" data-aksi="kat-baru"><svg><use href="#i-plus"/></svg><span>Tambah kategori</span></button>';
  };

  RENDER.tabungan = function () {
    var t = P().target;
    return kepala('Target tabungan', 'Sedikit-sedikit lama-lama jadi bukit', '<button class="tombol utama" type="button" data-aksi="target-baru" data-bagian="utama"><svg><use href="#i-plus"/></svg><span>Target baru</span></button>') +
      (t.length ? '<div class="target-grid">' + t.map(function (x, i) {
        var ps = x.target ? x.terkumpul / x.target : 0;
        return '<article class="panel target" data-bagian="panel" style="--i:' + i + '"><div class="target-atas">' + ikon(x.ikon || 'target', 'var(--utama)') + '<div><h2>' + esc(x.nama) + '</h2><small>' + Math.round(ps * 100) + '% tercapai</small></div><button type="button" class="ikon-btn" data-target-ubah="' + x.id + '" aria-label="Ubah target ' + esc(x.nama) + '"><svg><use href="#i-titik"/></svg></button></div>' +
          '<p class="besar">' + rp(x.terkumpul) + '<small> / ' + rp(x.target) + '</small></p><div class="progres" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(ps * 100) + '" aria-label="Progres ' + esc(x.nama) + '"><i style="--p:' + Math.min(100, ps * 100).toFixed(1) + '%"></i></div>' +
          '<div class="baris-tombol"><button type="button" class="tombol lembut" data-setor="' + x.id + '"><svg><use href="#i-plus"/></svg><span>Setor</span></button><small class="redup">Kurang ' + rp(Math.max(0, x.target - x.terkumpul)) + '</small></div></article>';
      }).join('') + '</div>' : '<article class="panel" data-bagian="panel">' + kosong('Belum ada target', 'Buat target pertama, misalnya dana darurat.') + '</article>');
  };

  RENDER.laporan = function () {
    var data = [];
    for (var i = 5; i >= 0; i--) { var k = geserBulan(bulanPilih, -i); data.push({ l: BLN[+k.slice(5) - 1], m: sumBulan(k, 'masuk'), k: sumBulan(k, 'keluar'), aktif: i === 0 }); }
    var bag = P().kategori.filter(function (c) { return c.jenis === 'keluar'; }).map(function (c) { return { nama: c.nama, n: sumBulan(bulanPilih, 'keluar', c.id), w: c.warna, ikon: c.ikon }; }).filter(function (b) { return b.n > 0; }).sort(function (a, b) { return b.n - a.n; });
    var tot = bag.reduce(function (a, b) { return a + b.n; }, 0), masuk = sumBulan(bulanPilih, 'masuk');
    var hemat = masuk ? Math.round((masuk - tot) / masuk * 100) : 0;
    return kepala('Laporan', 'Ke mana uangmu pergi', pemilihBulan()) +
      '<div class="lap-grid"><article class="panel" data-bagian="panel"><div class="judul-panel"><h2>6 bulan terakhir</h2></div>' + grafikBatang(data, 'Grafik pemasukan dan pengeluaran 6 bulan') + '</article>' +
      '<article class="panel" data-bagian="panel"><div class="judul-panel"><h2>Pengeluaran per kategori</h2></div>' +
      (bag.length ? '<div class="donat-wadah">' + donat(bag, ['Total keluar', rpPendek(tot)], 'Diagram pengeluaran per kategori') + '<ul class="legenda-kat">' + bag.map(function (b, i) { return '<li style="--i:' + i + '"><i style="background:' + b.w + '"></i><span>' + esc(b.nama) + '</span><b>' + Math.round(b.n / tot * 100) + '%</b><small>' + rp(b.n) + '</small></li>'; }).join('') + '</ul></div>' : kosong('Belum ada pengeluaran', 'Bulan ini masih bersih.')) + '</article>' +
      '<article class="panel sorot-hemat" data-bagian="aksen"><small>Rasio tabungan ' + bulanLabel(bulanPilih) + '</small><p class="besar">' + hemat + '%</p><p>' + (hemat >= 20 ? 'Mantap! Kamu menyisihkan lebih dari 20% pemasukan.' : hemat >= 0 ? 'Masih aman. Coba targetkan sisa minimal 20% dari pemasukan.' : 'Pengeluaran melebihi pemasukan. Cek kategori terbesar di atas.') + '</p></article></div>';
  };

  // ---------- Atur ----------
  RENDER.atur = function () {
    var profilDanPengaturan =
      '<article class="panel" data-bagian="panel"><h2>Profil</h2><form id="fProfil" class="form">' + fldGambar('Foto profil / avatar', 'avatar', P().avatar, P().nama || NAMA_TEMA) +
      fld('Nama panggilan (opsional)', 'nama', P().nama || '', 'maxlength="40"') + '<button class="tombol utama" type="submit" data-bagian="utama"><svg><use href="#i-cek"/></svg><span>Simpan profil</span></button></form></article>' +
      '<article class="panel" data-bagian="panel"><h2>Dompet</h2><p class="redup">Saldo awal tiap dompet. Saldo sekarang dihitung otomatis dari transaksi.</p><ul class="daftar">' + P().dompet.map(function (d) { return '<li><button type="button" class="baris" data-dompet="' + d.id + '">' + ikon(ikonDompet(d.jenis), 'var(--utama)') + '<span class="isi"><b>' + esc(d.nama) + '</b><small>Saldo awal ' + rp(d.saldoAwal) + '</small></span><span class="nilai">' + rp(saldoDompet(d.id)) + '</span></button></li>'; }).join('') + '</ul><div class="baris-tombol"><button type="button" class="tombol garis" data-aksi="dompet-baru"><svg><use href="#i-plus"/></svg><span>Tambah dompet</span></button><button type="button" class="tombol garis" data-aksi="pindah"><svg><use href="#i-tukar"/></svg><span>Pindah saldo</span></button></div></article>' +
      '<article class="panel" data-bagian="panel"><h2>Kategori</h2><div class="chip-wadah">' + P().kategori.map(function (k) { return '<button type="button" class="chip" data-kat-ubah="' + k.id + '"><span class="titik" style="background:' + k.warna + '"></span>' + esc(k.nama) + '</button>'; }).join('') + '</div><button type="button" class="tombol garis" data-aksi="kat-baru"><svg><use href="#i-plus"/></svg><span>Tambah kategori</span></button></article>';
    return kepala('Atur', 'Profil, data & cadangan') +
      '<div class="atur-grid">' +
      profilDanPengaturan +
      '<article class="panel" data-bagian="panel"><h2>Cadangan &amp; pindah HP</h2><p class="redup">Unduh cadangan transaksi dan pengaturan. Pemulihan mengganti isi akun aktif.</p><div class="baris-tombol"><button type="button" class="tombol utama" data-aksi="backup" data-bagian="utama"><svg><use href="#i-unduh"/></svg><span>Unduh cadangan (.json)</span></button><label class="tombol garis"><svg><use href="#i-unggah"/></svg><span>Pulihkan</span><input type="file" id="fPulih" accept="application/json,.json" class="sr"></label></div></article>' +
      '<article class="panel bahaya" data-bagian="panel"><h2>Mulai dari nol</h2><p class="redup">Hapus transaksi, target tabungan, dan saldo awal dompet.</p><button type="button" class="tombol bahaya-btn" data-aksi="kosongkan"><svg><use href="#i-hapus"/></svg><span>Kosongkan data</span></button></article></div>';
  };
  function fldGambar(label, kunci, src, nama) {
    return '<div class="fld fld-gambar"><span>' + label + '</span><div class="gbr-baris"><span class="gbr-prev">' + (gambarAman(src) ? gbr(src, nama) : '<svg aria-hidden="true"><use href="#i-orang"/></svg>') + '</span>' +
      '<label class="tombol garis"><svg><use href="#i-unduh"/></svg><span>Pilih gambar</span><input type="file" accept="image/*" class="gbr-input" data-unggah="' + kunci + '"></label>' +
      (gambarAman(src) ? '<button type="button" class="tombol garis" data-hapus-gambar="' + kunci + '">Hapus</button>' : '') + '</div><small class="redup">Diperkecil otomatis ke ' + GAMBAR.maks + ' px dan ikut cadangan.</small></div>';
  }
  function fld(label, nama, nilai, attr) { return '<label class="fld"><span>' + label + '</span><input name="' + nama + '" value="' + esc(nilai) + '" ' + (attr || '') + '></label>'; }

  // ---------- Dialog & form ----------
  var dlg = $('#dlg'), dlgOk = null, dlgHapus = null, tutupTimer;
  function dialog(judul, isi, ok, opsi) {
    clearTimeout(tutupTimer); dlg.classList.remove('keluar');
    opsi = opsi || {};
    $('#dlgIsi').onchange = null;
    $('#dlgJudul').textContent = judul; $('#dlgIsi').innerHTML = isi;
    $('#dlgOk').textContent = opsi.tombol || 'Simpan';
    dlgOk = ok; dlgHapus = opsi.hapus || null; $('#dlgHapus').hidden = !dlgHapus;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    pasangRupiah($('#dlgIsi'));
    setTimeout(function () { var f = $('#dlgIsi [autofocus]') || $('#dlgIsi input, #dlgIsi select'); if (f) f.focus(); }, 30);
  }
  function tutupDialog() { dlg.classList.add('keluar'); tutupTimer = setTimeout(function () { dlg.classList.remove('keluar'); if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }, GERAK ? 180 : 0); }
  $('#dlgForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var tombol = e.submitter ? e.submitter.value : 'ok';
    if (tombol === 'batal') { tutupDialog(); return; }
    if (dlgOk && dlgOk() === false) return;
    tutupDialog();
  });
  $('#dlgHapus').addEventListener('click', function () { if (dlgHapus) dlgHapus(); tutupDialog(); });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); tutupDialog(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) tutupDialog(); });

  function pasangRupiah(akar) {
    $$('[data-rupiah]', akar).forEach(function (i) { i.addEventListener('input', function () { var n = angkaDari(i.value); i.value = n ? n.toLocaleString('id-ID') : ''; }); });
  }
  function nilaiForm(akar) { var o = {}; $$('input,select,textarea', akar).forEach(function (i) { if (i.name) o[i.name] = i.type === 'radio' ? (i.checked ? i.value : o[i.name]) : i.value; }); return o; }
  function salahkan(nama, pesan) { var el = $('#dlgIsi [name="' + nama + '"]'); if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); var p = el.closest('.fld'); if (p && !$('.galat', p)) { var s = document.createElement('small'); s.className = 'galat'; s.textContent = pesan; p.appendChild(s); } } return false; }

  function saklarJenis(jenis) {
    return '<div class="saklar" role="radiogroup" aria-label="Jenis"><label><input type="radio" name="jenis" value="keluar"' + (jenis !== 'masuk' ? ' checked' : '') + '><span><svg><use href="#i-turun"/></svg>Pengeluaran</span></label><label><input type="radio" name="jenis" value="masuk"' + (jenis === 'masuk' ? ' checked' : '') + '><span><svg><use href="#i-naik"/></svg>Pemasukan</span></label></div>';
  }
  function chipKategori(jenis, pilih) {
    return P().kategori.filter(function (k) { return k.jenis === jenis; }).map(function (k) {
      return '<label class="kat-pilih"><input type="radio" name="kat" value="' + k.id + '"' + (k.id === pilih ? ' checked' : '') + '><span>' + ikon(k.ikon, k.warna, 'kecil') + esc(k.nama) + '</span></label>';
    }).join('');
  }

  function formTx(t) {
    var baru = !t; t = t || { jenis: 'keluar', jumlah: '', kat: 'makan', dompet: P().dompet[0] && P().dompet[0].id, t: hariIni(), ket: '' };
    dialog(baru ? 'Catat transaksi' : 'Ubah transaksi',
      saklarJenis(t.jenis) +
      '<label class="fld jumlah"><span>Jumlah</span><div class="rp-input"><b>Rp</b><input name="jumlah" inputmode="numeric" autocomplete="off" data-rupiah autofocus placeholder="0" value="' + (t.jumlah ? t.jumlah.toLocaleString('id-ID') : '') + '"></div></label>' +
      '<div class="cepat" aria-label="Nominal cepat">' + [10000, 25000, 50000, 100000].map(function (n) { return '<button type="button" data-tambah="' + n + '">+' + rpPendek(n) + '</button>'; }).join('') + '</div>' +
      '<fieldset class="fld"><legend>Kategori</legend><div class="kat-grid" id="katGrid">' + chipKategori(t.jenis, t.kat) + '</div></fieldset>' +
      '<div class="dua-kolom"><label class="fld"><span>Dompet</span><select name="dompet">' + P().dompet.map(function (d) { return '<option value="' + d.id + '"' + (d.id === t.dompet ? ' selected' : '') + '>' + esc(d.nama) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld"><span>Tanggal</span><input type="date" name="t" value="' + t.t + '"></label></div>' +
      '<label class="fld"><span>Catatan (opsional)</span><input name="ket" maxlength="80" placeholder="mis. Makan siang" value="' + esc(t.ket) + '"></label>',
      function () {
        var v = nilaiForm($('#dlgIsi')), n = angkaDari(v.jumlah);
        if (!n) return salahkan('jumlah', 'Isi jumlah dulu');
        if (!v.kat) { toast('Pilih kategori'); return false; }
        var o = { id: baru ? idBaru() : t.id, t: v.t || hariIni(), jenis: v.jenis, jumlah: n, kat: v.kat, dompet: v.dompet, ket: v.ket.trim() };
        if (baru) P().transaksi.push(o); else P().transaksi = P().transaksi.map(function (x) { return x.id === o.id ? o : x; });
        simpan(); baruId = o.id; ulang();
      },
      { hapus: baru ? null : function () { hapusDgnUrung(P(), 'transaksi', t); } });
    $('#dlgIsi').onchange = function (e) {
      if (e.target.name === 'jenis' && $('#katGrid')) { var j = e.target.value; $('#katGrid').innerHTML = chipKategori(j, j === 'masuk' ? 'gaji' : 'makan'); }
    };
  }
  function hapusDgnUrung(wadah, kunci, item) {
    var lama = wadah[kunci].slice();
    wadah[kunci] = lama.filter(function (x) { return x.id !== item.id; }); simpan(); ulang();
    toast('Entri dihapus', 'Urungkan', function () { wadah[kunci] = lama; simpan(); ulang(); toast('Dikembalikan'); });
  }

  function formKategori(k) {
    var baru = !k; k = k || { nama: '', ikon: 'titik', warna: WARNA[P().kategori.length % WARNA.length], jenis: 'keluar', anggaran: 0 };
    dialog(baru ? 'Kategori baru' : 'Ubah kategori',
      '<label class="fld"><span>Nama kategori</span><input name="nama" maxlength="30" value="' + esc(k.nama) + '" autofocus></label>' +
      (baru ? saklarJenis(k.jenis) : '') +
      (k.jenis === 'keluar' || baru ? '<label class="fld"><span>Anggaran per bulan (0 = tanpa batas)</span><div class="rp-input"><b>Rp</b><input name="anggaran" inputmode="numeric" data-rupiah value="' + (k.anggaran ? k.anggaran.toLocaleString('id-ID') : '') + '"></div></label>' : '') +
      '<fieldset class="fld"><legend>Ikon</legend><div class="ikon-grid">' + IKON.map(function (n) { return '<label><input type="radio" name="ikon" value="' + n + '"' + (n === k.ikon ? ' checked' : '') + '><span><svg aria-hidden="true"><use href="#i-' + n + '"/></svg><i class="sr">' + n + '</i></span></label>'; }).join('') + '</div></fieldset>' +
      '<fieldset class="fld"><legend>Warna</legend><div class="warna-grid">' + WARNA.map(function (w) { return '<label><input type="radio" name="warna" value="' + w + '"' + (w === k.warna ? ' checked' : '') + '><span style="background:' + w + '"><i class="sr">' + w + '</i></span></label>'; }).join('') + '</div></fieldset>',
      function () {
        var v = nilaiForm($('#dlgIsi'));
        if (!v.nama.trim()) return salahkan('nama', 'Nama wajib diisi');
        var o = { id: baru ? idBaru() : k.id, nama: v.nama.trim(), ikon: v.ikon || 'titik', warna: v.warna || k.warna, jenis: baru ? v.jenis : k.jenis, anggaran: angkaDari(v.anggaran) };
        if (baru) P().kategori.push(o); else P().kategori = P().kategori.map(function (x) { return x.id === o.id ? o : x; });
        simpan(); ulang(); toast('Kategori disimpan');
      },
      { hapus: baru ? null : function () {
        if (P().transaksi.some(function (t) { return t.kat === k.id; })) { toast('Kategori masih dipakai transaksi — ganti dulu kategorinya'); return; }
        hapusDgnUrung(P(), 'kategori', k);
      } });
  }
  function formAnggaran(k) {
    dialog('Anggaran ' + k.nama, '<label class="fld"><span>Batas per bulan (0 = tanpa batas)</span><div class="rp-input"><b>Rp</b><input name="anggaran" inputmode="numeric" data-rupiah autofocus value="' + (k.anggaran ? k.anggaran.toLocaleString('id-ID') : '') + '"></div></label>' +
      '<div class="cepat">' + [300000, 500000, 1000000, 2000000].map(function (n) { return '<button type="button" data-set="' + n + '">' + rpPendek(n) + '</button>'; }).join('') + '</div>',
      function () { k.anggaran = angkaDari(nilaiForm($('#dlgIsi')).anggaran); simpan(); ulang(); toast('Anggaran ' + k.nama + ' diperbarui'); });
  }
  function formDompet(d) {
    var baru = !d; d = d || { nama: '', jenis: 'ewallet', saldoAwal: 0 };
    dialog(baru ? 'Dompet baru' : 'Ubah dompet',
      '<label class="fld"><span>Nama</span><input name="nama" maxlength="30" placeholder="mis. Mandiri, OVO, Celengan" value="' + esc(d.nama) + '" autofocus></label>' +
      '<div class="dua-kolom"><label class="fld"><span>Jenis</span><select name="jenis"><option value="tunai"' + (d.jenis === 'tunai' ? ' selected' : '') + '>Tunai</option><option value="bank"' + (d.jenis === 'bank' ? ' selected' : '') + '>Bank</option><option value="ewallet"' + (d.jenis === 'ewallet' ? ' selected' : '') + '>E-wallet</option></select></label>' +
      '<label class="fld"><span>Saldo awal</span><div class="rp-input"><b>Rp</b><input name="saldoAwal" inputmode="numeric" data-rupiah value="' + (d.saldoAwal ? d.saldoAwal.toLocaleString('id-ID') : '') + '"></div></label></div>',
      function () {
        var v = nilaiForm($('#dlgIsi')); if (!v.nama.trim()) return salahkan('nama', 'Nama wajib diisi');
        var o = { id: baru ? idBaru() : d.id, nama: v.nama.trim(), jenis: v.jenis, saldoAwal: angkaDari(v.saldoAwal) };
        if (baru) P().dompet.push(o); else P().dompet = P().dompet.map(function (x) { return x.id === o.id ? o : x; });
        simpan(); ulang(); toast('Dompet disimpan');
      },
      { hapus: baru ? null : function () {
        if (P().transaksi.some(function (t) { return t.dompet === d.id || t.ke === d.id; })) { toast('Dompet masih dipakai transaksi'); return; }
        hapusDgnUrung(P(), 'dompet', d);
      } });
  }
  function formPindah(t) {
    var baru = !t, ds = P().dompet; t = t || { jumlah: '', dompet: ds[1] ? ds[1].id : ds[0].id, ke: ds[0].id, t: hariIni(), ket: '' };
    function ops(pilih) { return ds.map(function (d) { return '<option value="' + d.id + '"' + (d.id === pilih ? ' selected' : '') + '>' + esc(d.nama) + ' (' + rp(saldoDompet(d.id)) + ')</option>'; }).join(''); }
    dialog(baru ? 'Pindah saldo' : 'Ubah pindah saldo',
      '<p class="redup">Mis. tarik tunai dari ATM atau isi saldo e-wallet. Tidak dihitung sebagai pemasukan/pengeluaran.</p>' +
      '<label class="fld jumlah"><span>Jumlah</span><div class="rp-input"><b>Rp</b><input name="jumlah" inputmode="numeric" autocomplete="off" data-rupiah autofocus placeholder="0" value="' + (t.jumlah ? t.jumlah.toLocaleString('id-ID') : '') + '"></div></label>' +
      '<div class="dua-kolom"><label class="fld"><span>Dari</span><select name="dompet">' + ops(t.dompet) + '</select></label><label class="fld"><span>Ke</span><select name="ke">' + ops(t.ke) + '</select></label></div>' +
      '<div class="dua-kolom"><label class="fld"><span>Tanggal</span><input type="date" name="t" value="' + t.t + '"></label><label class="fld"><span>Catatan</span><input name="ket" maxlength="60" placeholder="Tarik tunai ATM" value="' + esc(t.ket) + '"></label></div>',
      function () {
        var v = nilaiForm($('#dlgIsi')), n = angkaDari(v.jumlah);
        if (!n) return salahkan('jumlah', 'Isi jumlah dulu');
        if (v.dompet === v.ke) return salahkan('ke', 'Pilih dompet tujuan yang berbeda');
        var o = { id: baru ? idBaru() : t.id, t: v.t || hariIni(), jenis: 'pindah', jumlah: n, dompet: v.dompet, ke: v.ke, ket: v.ket.trim() };
        if (baru) P().transaksi.push(o); else P().transaksi = P().transaksi.map(function (x) { return x.id === o.id ? o : x; });
        simpan(); baruId = o.id; ulang(); toast('Saldo dipindah ' + rp(n));
      },
      { hapus: baru ? null : function () { hapusDgnUrung(P(), 'transaksi', t); } });
  }
  function formTarget(t) {
    var baru = !t; t = t || { nama: '', target: 0, terkumpul: 0, ikon: 'target' };
    dialog(baru ? 'Target baru' : 'Ubah target',
      '<label class="fld"><span>Nama target</span><input name="nama" maxlength="30" placeholder="mis. Umrah, DP rumah" value="' + esc(t.nama) + '" autofocus></label>' +
      '<div class="dua-kolom"><label class="fld"><span>Target</span><div class="rp-input"><b>Rp</b><input name="target" inputmode="numeric" data-rupiah value="' + (t.target ? t.target.toLocaleString('id-ID') : '') + '"></div></label>' +
      '<label class="fld"><span>Sudah terkumpul</span><div class="rp-input"><b>Rp</b><input name="terkumpul" inputmode="numeric" data-rupiah value="' + (t.terkumpul ? t.terkumpul.toLocaleString('id-ID') : '') + '"></div></label></div>',
      function () {
        var v = nilaiForm($('#dlgIsi')); if (!v.nama.trim()) return salahkan('nama', 'Nama wajib diisi'); if (!angkaDari(v.target)) return salahkan('target', 'Isi nominal target');
        var o = { id: baru ? idBaru() : t.id, nama: v.nama.trim(), target: angkaDari(v.target), terkumpul: angkaDari(v.terkumpul), ikon: t.ikon || 'target' };
        if (baru) P().target.push(o); else P().target = P().target.map(function (x) { return x.id === o.id ? o : x; });
        simpan(); ulang(); toast('Target disimpan');
      },
      { hapus: baru ? null : function () { hapusDgnUrung(P(), 'target', t); } });
  }
  function formSetor(t) {
    dialog('Setor ke ' + t.nama, '<label class="fld"><span>Jumlah setoran</span><div class="rp-input"><b>Rp</b><input name="n" inputmode="numeric" data-rupiah autofocus></div></label><p class="redup">Kurang ' + rp(Math.max(0, t.target - t.terkumpul)) + ' lagi.</p>',
      function () {
        var n = angkaDari(nilaiForm($('#dlgIsi')).n); if (!n) return salahkan('n', 'Isi jumlah');
        t.terkumpul += n; simpan(); ulang();
        toast(t.terkumpul >= t.target ? 'Target ' + t.nama + ' tercapai!' : 'Tersetor ' + rp(n));
      }, { tombol: 'Setor' });
  }

  // ---------- Ekspor & cadangan ----------
  function unduh(nama, isi, tipe) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([isi], { type: tipe })); a.download = nama;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(baris) { return '﻿' + baris.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';'); }).join('\r\n'); }
  function csvPribadi() {
    var rows = [['Tanggal', 'Jenis', 'Kategori', 'Dompet', 'Catatan', 'Jumlah']];
    urutTx(P().transaksi).filter(function (t) { return bulanKey(t.t) === bulanPilih; }).reverse().forEach(function (t) { if (t.jenis === 'pindah') rows.push([t.t, 'Pindah saldo', '', dompet(t.dompet).nama + ' > ' + dompet(t.ke).nama, t.ket, t.jumlah]); else rows.push([t.t, t.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran', kat(t.kat).nama, dompet(t.dompet).nama, t.ket, t.jenis === 'masuk' ? t.jumlah : -t.jumlah]); });
    unduh('transaksi-' + bulanPilih + '.csv', csv(rows), 'text/csv;charset=utf-8'); toast('CSV ' + bulanLabel(bulanPilih) + ' diunduh');
  }
  function backup() { var x = JSON.parse(JSON.stringify(D)); unduh('cadangan-keuangan-' + hariIni() + '.json', JSON.stringify(x, null, 1), 'application/json'); toast('Cadangan diunduh. Simpan di Google Drive/WA ke diri sendiri.'); }
  function pulihkan(file) {
    var akun = kondisi;
    var fr = new FileReader();
    fr.onload = function () {
      if (akun !== kondisi || (!DEMO && !akun)) return;
      try {
        var x = dataPribadi(JSON.parse(fr.result));
        dialog('Pulihkan cadangan?', '<p>Data Pribadi di akun ini akan <b>diganti</b> dengan isi berkas <b>' + esc(file.name) + '</b> (' + x.pribadi.transaksi.length + ' transaksi). Lanjut?</p>', function () {
          D = x; simpan(); renderMenu(); buka('atur');
        }, { tombol: 'Ganti data' });
      } catch (e) { toast('Berkas bukan cadangan aplikasi ini'); }
    };
    fr.readAsText(file);
  }
  function kosongkan() {
    dialog('Kosongkan data Pribadi?', '<p>Semua transaksi, target tabungan, dan saldo awal dompet akan dihapus. Kategori tetap. Ketik <b>HAPUS</b> untuk konfirmasi.</p><label class="fld"><span>Konfirmasi</span><input name="konf" autocomplete="off" autofocus></label>', function () {
      if (nilaiForm($('#dlgIsi')).konf.trim().toUpperCase() !== 'HAPUS') return salahkan('konf', 'Ketik HAPUS');
      P().transaksi = [];
      P().target = [];
      P().dompet.forEach(function (d) { d.saldoAwal = 0; });
      simpan(); ulang(); toast('Data dikosongkan. Selamat mulai!');
    }, { tombol: 'Kosongkan' });
  }

  // ---------- Peristiwa ----------
  var baruId = null;
  function pasangHal() {
    if (baruId) { var el = $('[data-tx="' + baruId + '"]'); if (el) el.classList.add('baru'); baruId = null; }
    var q = $('#qTx'); if (q) q.addEventListener('input', debounce(function () { filterTx.q = q.value; var pos0 = q.selectionStart; ulang(); var n = $('#qTx'); n.focus(); n.setSelectionRange(pos0, pos0); }, 250));
    var kf = $('#katF'); if (kf) kf.addEventListener('change', function () { filterTx.kat = kf.value; ulang(); });
    $$('[data-unggah]').forEach(function (inp) { inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; inp.value = ''; if (!f || !/^image\//.test(f.type)) return;
      var akun = kondisi;
      kecilkan(f, function (d) { if (akun !== kondisi || (!DEMO && !akun)) return; P().avatar = d; simpan(); renderMerek(); ulang(); toast('Foto profil disimpan'); });
    }); });
    $$('[data-hapus-gambar]').forEach(function (bt) { bt.addEventListener('click', function () {
      P().avatar = ''; simpan(); renderMerek(); ulang(); toast('Gambar dihapus');
    }); });
    var fpr = $('#fProfil'); if (fpr) fpr.addEventListener('submit', function (e) { e.preventDefault(); P().nama = nilaiForm(fpr).nama.trim(); simpan(); renderMerek(); toast('Profil disimpan'); });
    pasangRupiah($('#hal'));
    var fp = $('#fPulih'); if (fp) fp.addEventListener('change', function () { if (fp.files[0]) pulihkan(fp.files[0]); fp.value = ''; });
  }
  function debounce(f, ms) { var t; return function () { clearTimeout(t); t = setTimeout(f, ms); }; }

  document.addEventListener('click', function (e) {
    if (!D || $('#appPribadi').inert) return;
    var t = e.target.closest('button'); if (!t) return;
    var d = t.dataset;
    if (d.hal) { buka(d.hal); return; }
    if (d.ke) { buka(d.ke); return; }
    if (d.bulan) { bulanPilih = geserBulan(bulanPilih, +d.bulan); ulang(); return; }
    if (d.jenisF !== undefined) { filterTx.jenis = d.jenisF; ulang(); return; }
    if (d.pindah) { formPindah(P().transaksi.filter(function (x) { return x.id === d.pindah; })[0]); return; }
    if (d.tx) { formTx(P().transaksi.filter(function (x) { return x.id === d.tx; })[0]); return; }
    if (d.angg) { formAnggaran(kat(d.angg)); return; }
    if (d.katUbah) { formKategori(kat(d.katUbah)); return; }
    if (d.dompet) { if (halAktif === 'atur') formDompet(dompet(d.dompet)); else { filterTx.q = ''; buka('transaksi'); } return; }
    if (d.targetUbah) { formTarget(P().target.filter(function (x) { return x.id === d.targetUbah; })[0]); return; }
    if (d.setor) { formSetor(P().target.filter(function (x) { return x.id === d.setor; })[0]); return; }
    if (d.tambah) { var i = $('#dlgIsi [name="jumlah"]'); i.value = (angkaDari(i.value) + +d.tambah).toLocaleString('id-ID'); i.focus(); return; }
    if (d.set) { var j = $('#dlgIsi [name="anggaran"]'); j.value = (+d.set).toLocaleString('id-ID'); return; }
    switch (d.aksi) {
      case 'tambah': formTx(); break;
      case 'csv-pribadi': csvPribadi(); break;
      case 'kat-baru': formKategori(); break;
      case 'dompet-baru': formDompet(); break;
      case 'pindah': formPindah(); break;
      case 'target-baru': formTarget(); break;
      case 'backup': backup(); break;
      case 'kosongkan': kosongkan(); break;
    }
  });
  $('#fab').addEventListener('click', function () { formTx(); });

  // ---------- Toast ----------
  var toastT;
  function toast(teks, aksi, fn) {
    var t = $('#toast'); clearTimeout(toastT);
    t.innerHTML = '<span>' + esc(teks) + '</span>' + (aksi ? '<button type="button">' + esc(aksi) + '</button>' : '');
    if (aksi) $('button', t).onclick = function () { fn(); };
    t.classList.add('tampil'); toastT = setTimeout(function () { t.classList.remove('tampil'); }, aksi ? 5000 : 2600);
  }

  // ---------- Angka menghitung naik ----------
  function hitungNaik() {
    $$('.hitung').forEach(function (el) {
      var n = +el.dataset.n; if (!GERAK || !n) return;
      var t0 = performance.now(), dur = 700;
      (function langkah(t) { var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = rp(n * e); if (p < 1) requestAnimationFrame(langkah); })(t0);
    });
  }

  // ---------- Tema (customizer Maliki Studio, lihat tema.css & tema.js) ----------
  var FONT_OK = ['Plus Jakarta Sans', 'Inter', 'Poppins', 'DM Sans', 'Space Grotesk', 'Nunito'];
  function terapkanTema(t) {
    var r = document.documentElement, st = r.style;
    if (t.utama) st.setProperty('--tema-utama', t.utama);
    if (t.aksen) st.setProperty('--tema-aksen', t.aksen);
    if (t.radius != null) st.setProperty('--tema-radius', typeof t.radius === 'number' ? t.radius + 'px' : t.radius);
    if (t.font) {
      var f = String(t.font).split(',')[0].replace(/["']/g, '').trim();
      st.setProperty('--tema-font', '"' + f + '", system-ui, sans-serif');
      var l = $('#fontTema'); if (l && FONT_OK.indexOf(f) >= 0) l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700;800&display=swap';
    }
    if (t.mode) r.setAttribute('data-mode', t.mode === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang') : t.mode);
    if (t.bagian) terapkanBagian(t.bagian);
    if (t.nama) { NAMA_TEMA = t.nama; $$('[data-tema-nama]').forEach(function (e) { e.textContent = t.nama; }); }
    setTimeout(hitungTeksBagian, 0);
  }
  window.addEventListener('message', function (e) { if (DEMO && e.source === parent && e.data && e.data.tipe === 'tema') terapkanTema(e.data); });

  // ---------- Bagian (warna per bagian, sorot, tap-untuk-pilih) ----------
  var NAMA_BAGIAN = { nav: 'Navigasi', latar: 'Latar', panel: 'Panel', utama: 'Warna utama', aksen: 'Aksen', teks: 'Teks' };
  var VAR_BAGIAN = { latar: '--latar', panel: '--kartu', nav: '--nav', teks: '--teks' };
  var PETA_TAMBAHAN = { aksen: '.pil-status, .chip-bulan, .legenda .m, .ring-ikon', teks: 'h2', utama: '.nav.aktif' };
  function tandaiBagian() {
    Object.keys(PETA_TAMBAHAN).forEach(function (b) { $$(PETA_TAMBAHAN[b]).forEach(function (el) { if (!el.hasAttribute('data-bagian')) el.setAttribute('data-bagian', b); }); });
  }
  function warnaNyata(v) {
    var p = document.createElement('i'); p.style.cssText = 'position:absolute;width:0;height:0;background:var(' + v + ')';
    document.body.appendChild(p); var c = getComputedStyle(p).backgroundColor; p.remove();
    var m = (c.match(/[\d.]+/g) || [255, 255, 255]).map(Number);
    if (/^color\(srgb/.test(c)) m = m.map(function (x) { return x * 255; });
    return m.slice(0, 3);
  }
  function teksUntuk(v) {
    var l = warnaNyata(v).map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return (0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]) > 0.4 ? '#14171a' : '#ffffff';
  }
  function hitungTeksBagian() {
    var st = document.documentElement.style;
    st.setProperty('--tema-nav-teks', teksUntuk('--nav'));
    st.setProperty('--tema-utama-teks', teksUntuk('--utama'));
    st.setProperty('--tema-aksen-teks', teksUntuk('--aksen'));
  }
  function terapkanBagian(bg) {
    var st = document.documentElement.style;
    Object.keys(VAR_BAGIAN).forEach(function (k) {
      if (bg[k] === undefined) return;
      if (bg[k]) { st.setProperty('--tema-' + k, bg[k]); st.setProperty(VAR_BAGIAN[k], bg[k]); }
      else { st.removeProperty('--tema-' + k); st.removeProperty(VAR_BAGIAN[k]); }
    });
  }
  var sorotAktif = null;
  function sorot(b) {
    sorotAktif = b;
    $$('[data-sorot]').forEach(function (e) { e.removeAttribute('data-sorot'); });
    $$('.label-sorot').forEach(function (e) { e.remove(); });
    if (!b) return;
    $$('[data-bagian="' + b + '"]').forEach(function (e) {
      e.setAttribute('data-sorot', '');
      var r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
      var lb = document.createElement('span'); lb.className = 'label-sorot'; lb.textContent = NAMA_BAGIAN[b] || b;
      lb.style.left = Math.max(2, r.left + 4) + 'px'; lb.style.top = Math.max(2, r.top + 4) + 'px';
      document.body.appendChild(lb);
    });
  }
  var modePilih = false, hoverEl = null;
  function bagianDari(t) { return t && t.closest ? t.closest('[data-bagian]') : null; }
  function setPilih(on) {
    modePilih = !!on; document.documentElement.classList.toggle('mode-pilih', modePilih);
    if (!modePilih && hoverEl) { hoverEl.removeAttribute('data-pilih-hover'); hoverEl = null; }
  }
  ['click', 'pointerdown', 'mousedown', 'touchstart', 'submit', 'keydown'].forEach(function (tipe) {
    document.addEventListener(tipe, function (e) {
      if (!modePilih) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (tipe === 'click') { var el = bagianDari(e.target); if (el) parent.postMessage({ tipe: 'bagian-dipilih', bagian: el.getAttribute('data-bagian') }, '*'); }
    }, { capture: true, passive: false });
  });
  document.addEventListener('mouseover', function (e) {
    if (!modePilih) return; var el = bagianDari(e.target);
    if (hoverEl && hoverEl !== el) hoverEl.removeAttribute('data-pilih-hover');
    hoverEl = el; if (el) el.setAttribute('data-pilih-hover', '');
  }, true);
  window.addEventListener('message', function (e) {
    var d = e.data; if (!DEMO || e.source !== parent || !d) return;
    if (d.tipe === 'sorot') sorot(d.bagian || null);
    else if (d.tipe === 'mode-pilih') setPilih(d.aktif);
  });
  new MutationObserver(function (ms) {
    var mode = ms.some(function (m) { return m.type === 'attributes'; });
    var dom = ms.some(function (m) { return m.type === 'childList' && Array.prototype.some.call(m.addedNodes, function (n) { return n.nodeType === 1 && n.className !== 'label-sorot'; }); });
    if (dom) { tandaiBagian(); if (sorotAktif) sorot(sorotAktif); } if (mode) hitungTeksBagian();
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-mode'] });

  // ---------- Akun ----------
  var daftarAkun = false, sibukAkun = false, versiSesi = 0;
  function pesanAkun(teks) { $('#pesanAkun').textContent = teks; }

  function tampilAplikasi() {
    $('#aksesAkun').hidden = true;
    $('#appPribadi').hidden = false;
    var awal = (location.hash || '').slice(1);
    renderMenu();
    buka(awal, true);
    tandaiBagian(); hitungTeksBagian();
  }

  async function gantiSesi(sesi, paksa) {
    if (!paksa && sesi && sesiAktif && sesi.user.id === sesiAktif.user.id) return;
    var versi = ++versiSesi;
    sesiAktif = sesi;
    kondisi = null;
    D = null;
    clearTimeout(tutupTimer);
    clearTimeout(toastT);
    dlg.classList.remove('keluar');
    if (dlg.open) dlg.close();
    dlgOk = dlgHapus = null;
    $('#dlgIsi').replaceChildren();
    $('#toast').classList.remove('tampil');
    $('#toast').replaceChildren();
    $('#hal').replaceChildren();
    $('#emailAktif').textContent = '';
    $('#appPribadi').hidden = true;
    $('#aksesAkun').hidden = false;
    $('#formAkun').hidden = !!sesi;
    $('#aksiGagalMuat').hidden = true;
    statusSimpan('');
    bulanPilih = hariIni().slice(0, 7);
    filterTx = Object.assign({}, filterTxAwal);
    $('#formAkun').reset();
    if (!sesi) { pesanAkun('Masuk atau daftar untuk membuka catatanmu.'); return; }
    pesanAkun('Memuat catatan…');
    try {
      var hasil = await klien.rpc('muat_pribadi');
      if (versi !== versiSesi) return;
      if (hasil.error) throw hasil.error;
      if (hasil.data.pemilik !== sesi.user.id) throw new Error('Sesi berubah');
      D = hasil.data.pribadi ? dataPribadi(hasil.data) : dataKosong();
      kondisi = { id: sesi.user.id, revisi: hasil.data.revisi, draf: null, mengirim: false, konflik: false };
      $('#emailAktif').textContent = sesi.user.email || '';
      $('#akunAktif').hidden = false;
      tampilAplikasi();
    } catch (e) {
      if (versi !== versiSesi) return;
      pesanAkun('Catatan gagal dimuat. Periksa koneksi dan pastikan supabase.sql sudah dijalankan.');
      $('#aksiGagalMuat').hidden = false;
    }
  }

  $('#alihAkun').addEventListener('click', function () {
    if (sibukAkun) return;
    daftarAkun = !daftarAkun;
    $('#judulAkun').textContent = daftarAkun ? 'Buat akun Catatan Keuangan' : 'Masuk ke Catatan Keuangan';
    $('#kirimAkun').textContent = daftarAkun ? 'Daftar' : 'Masuk';
    $('#alihAkun').textContent = daftarAkun ? 'Sudah punya akun? Masuk' : 'Buat akun baru';
    $('#sandiAkun').autocomplete = daftarAkun ? 'new-password' : 'current-password';
    $('#sandiAkun').minLength = daftarAkun ? 6 : 0;
    pesanAkun('');
  });

  $('#formAkun').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!klien || sibukAkun) return;
    sibukAkun = true;
    $('#kirimAkun').disabled = true;
    var form = new FormData(e.currentTarget);
    var kredensial = { email: form.get('email').trim(), password: form.get('password') };
    pesanAkun(daftarAkun ? 'Mendaftarkan akun…' : 'Memeriksa akun…');
    try {
      var hasil;
      if (daftarAkun) {
        var alamat = new URL(location.href);
        alamat.hash = alamat.search = '';
        kredensial.options = { emailRedirectTo: alamat.href };
        hasil = await klien.auth.signUp(kredensial);
      } else {
        hasil = await klien.auth.signInWithPassword(kredensial);
      }
      if (hasil.error) throw hasil.error;
      if (!hasil.data.session) {
        $('#sandiAkun').value = '';
        pesanAkun('Cek email untuk tautan konfirmasi, lalu masuk.');
      }
    } catch (e) {
      pesanAkun(e.code === 'email_not_confirmed' ? 'Konfirmasi email sebelum masuk.' :
        (daftarAkun ? 'Gagal mendaftar. ' + e.message :
          'Gagal masuk. Periksa email, kata sandi, dan koneksi.'));
    } finally {
      sibukAkun = false;
      $('#kirimAkun').disabled = false;
    }
  });

  async function keluarAkun() {
    if (kondisi && kondisi.draf !== null) {
      if (kondisi.mengirim) { toast('Tunggu sampai perubahan tersimpan.'); return; }
      if (!window.confirm('Ada perubahan yang belum tersimpan. Unduh cadangan sebelum keluar. Tetap keluar?')) return;
    }
    $('#keluarAkun').disabled = $('#keluarGagalMuat').disabled = true;
    $('#appPribadi').inert = true;
    try {
      var hasil = await klien.auth.signOut({ scope: 'local' });
      if (hasil.error) throw hasil.error;
      await gantiSesi(null);
    } catch (e) {
      if (D) toast('Gagal keluar. Coba lagi.');
      else pesanAkun('Gagal keluar. Coba lagi.');
    } finally {
      $('#keluarAkun').disabled = $('#keluarGagalMuat').disabled = false;
      $('#appPribadi').inert = false;
    }
  }
  $('#keluarAkun').addEventListener('click', keluarAkun);
  $('#keluarGagalMuat').addEventListener('click', keluarAkun);

  $('#ulangMuat').addEventListener('click', function () { gantiSesi(sesiAktif, true); });
  $('#ulangSimpan').addEventListener('click', function () { if (kondisi) kirimSimpanan(kondisi); });
  $('#cadangPerubahan').addEventListener('click', backup);
  window.addEventListener('beforeunload', function (e) {
    if (kondisi && kondisi.draf !== null) { e.preventDefault(); e.returnValue = true; }
  });

  // ---------- Mulai ----------
  $$('[data-tema-nama]').forEach(function (e) { e.textContent = NAMA_TEMA; });
  if (DEMO) {
    D = dataContoh();
    $('#pitaDemo').hidden = false;
    tampilAplikasi();
    return;
  }

  var konfigurasi = window.KONFIG_SUPABASE;
  if (!konfigurasi || /PROJECT_REF/.test(konfigurasi.url) ||
      !/^sb_publishable_/.test(konfigurasi.publishableKey) || /GANTI_INI/.test(konfigurasi.publishableKey)) {
    pesanAkun('Isi Project URL dan Publishable key di supabase-config.js.');
    return;
  }
  if (!window.supabase) { pesanAkun('Supabase belum bisa dimuat. Periksa koneksi lalu segarkan halaman.'); return; }
  try {
    klien = window.supabase.createClient(konfigurasi.url, konfigurasi.publishableKey);
    klien.auth.onAuthStateChange(function (peristiwa, sesi) {
      setTimeout(function () { gantiSesi(sesi); }, 0);
    });
  } catch (e) {
    pesanAkun('Konfigurasi Supabase tidak valid. Periksa supabase-config.js.');
  }
})();
