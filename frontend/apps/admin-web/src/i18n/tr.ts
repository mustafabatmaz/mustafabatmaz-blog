// All admin UI text lives here (admin-web is Turkish only; see the i18n exception in the decisions)
export const tr = {
  app: {
    title: "Yönetim paneli",
    owner: "Mustafa Batmaz",
    home: "Yönetim paneli ana sayfası",
  },
  common: {
    loading: "Yükleniyor…",
    retry: "Tekrar dene",
    comingSoon: "Bu bölüm henüz hazır değil.",
  },
  auth: {
    sessionCheckFailed: "Oturum kontrol edilemedi. Backend çalışıyor mu?",
    logout: "Çıkış yap",
  },
  login: {
    title: "Giriş yap",
    username: "Kullanıcı adı",
    password: "Şifre",
    submit: "Giriş yap",
    submitting: "Giriş yapılıyor…",
    usernameRequired: "Kullanıcı adı gerekli.",
    passwordRequired: "Şifre gerekli.",
    invalidCredentials: "Kullanıcı adı veya şifre hatalı.",
    tooManyAttempts: "Çok fazla deneme yapıldı. 15 dakika sonra tekrar dene.",
    failed: "Giriş yapılamadı. Biraz sonra tekrar dene.",
    sessionExpired: "Oturumun süresi doldu. Yeniden giriş yap.",
    sessionHint: "Oturum 8 saat açık kalır.",
  },
  nav: {
    label: "Yönetim menüsü",
    content: "İçerik",
    profileGroup: "Kartvizit",
    posts: "Yazılar",
    media: "Medya",
    experience: "Deneyim",
    pages: "Sayfalar",
    uses: "Kullandıklarım",
    profile: "Profil",
  },
  notFound: {
    title: "Sayfa bulunamadı",
    back: "Yazılara dön",
  },
  theme: {
    toggle: "Temayı değiştir",
  },
} as const;

export type Messages = typeof tr;
