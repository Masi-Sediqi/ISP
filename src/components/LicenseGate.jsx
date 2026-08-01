import {
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  Copy,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  getLicenseLanguage,
  licenseTranslations,
} from "../utils/licenseTranslations";

import "./LicenseGate.css";

const statusTranslation = {
  "invalid-code": "invalid",
  "invalid-signature": "invalid",
  "wrong-product": "invalid",
  "invalid-expiration": "invalid",
  "device-mismatch": "mismatch",
  "not-started": "notStarted",
  "clock-rollback": "clock",
  "storage-error": "storage",
};

function LicenseGate({ children }) {
  const [language, setLanguage] =
    useState(getLicenseLanguage());

  const [licenseStatus, setLicenseStatus] =
    useState(null);

  const [licenseCode, setLicenseCode] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const t =
    licenseTranslations[language] ||
    licenseTranslations.en;

  const licenseApi =
    window.ispDesktop?.license;

  useEffect(() => {
    const handleLanguageChange = (
      event
    ) => {
      setLanguage(
        event.detail?.language ||
          getLicenseLanguage()
      );
    };

    window.addEventListener(
      "app-language-changed",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "app-language-changed",
        handleLanguageChange
      );
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkLicense() {
      if (!licenseApi) {
        /*
         * اجازه اجرای Browser Dev را می‌دهد.
         * در نسخه Electron حتماً API موجود است.
         */
        if (mounted) {
          setLicenseStatus({
            valid: true,
            status: "browser-development",
          });
        }

        return;
      }

      try {
        const result =
          await licenseApi.getStatus();

        if (mounted) {
          setLicenseStatus(result);
        }
      } catch {
        if (mounted) {
          setLicenseStatus({
            valid: false,
            status: "storage-error",
          });
        }
      }
    }

    checkLicense();

    return () => {
      mounted = false;
    };
  }, [licenseApi]);

  async function activate(event) {
    event.preventDefault();

    const value =
      licenseCode.trim();

    if (!value) {
      setMessage(t.invalid);
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result =
        await licenseApi.activate(
          value
        );

      setLicenseStatus(result);

      if (result.valid) {
        setLicenseCode("");
        return;
      }

      const translationKey =
        statusTranslation[
          result.status
        ];

      setMessage(
        translationKey
          ? t[translationKey]
          : t.invalid
      );
    } catch {
      setMessage(t.invalid);
    } finally {
      setBusy(false);
    }
  }

  async function copyDeviceId() {
    await navigator.clipboard.writeText(
      licenseStatus.deviceId || ""
    );

    setMessage(t.copied);
  }

  if (!licenseStatus) {
    return (
      <div className="license-loading">
        <LoaderCircle size={28} />
        <span>{t.checking}</span>
      </div>
    );
  }

  if (licenseStatus.valid) {
    return children;
  }

  const expired =
    licenseStatus.status ===
    "expired";

  const direction =
    language === "en"
      ? "ltr"
      : "rtl";

  return (
    <main
      className="license-page"
      dir={direction}
    >
      <section className="license-card">
        <header className="license-header">
          <span className="license-header-icon">
            {expired ? (
              <AlertTriangle size={28} />
            ) : (
              <ShieldCheck size={28} />
            )}
          </span>

          <div>
            <h1>
              {expired
                ? t.expiredTitle
                : t.title}
            </h1>

            <p>
              {expired
                ? t.expiredMessage
                : t.subtitle}
            </p>
          </div>
        </header>

        <div className="license-device-box">
          <div className="license-device-title">
            <Fingerprint size={18} />
            <span>{t.deviceId}</span>
          </div>

          <code>
            {licenseStatus.deviceId}
          </code>

          <button
            type="button"
            onClick={copyDeviceId}
          >
            <Copy size={15} />
            {t.copy}
          </button>
        </div>

        <form
          className="license-form"
          onSubmit={activate}
        >
          <label>
            <span>
              <KeyRound size={16} />
              {t.licenseCode}
            </span>

            <textarea
              value={licenseCode}
              placeholder={t.placeholder}
              spellCheck="false"
              autoComplete="off"
              onChange={(event) =>
                setLicenseCode(
                  event.target.value
                )
              }
            />
          </label>

          {message && (
            <div className="license-message">
              <AlertTriangle size={15} />
              <span>{message}</span>
            </div>
          )}

          <button
            className="license-submit"
            type="submit"
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle
                className="license-spin"
                size={17}
              />
            ) : (
              <ShieldCheck size={17} />
            )}

            {busy
              ? t.activating
              : t.activate}
          </button>
        </form>

        <p className="license-support">
          {t.support}
        </p>
      </section>
    </main>
  );
}

export default LicenseGate;