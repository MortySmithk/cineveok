import Image from 'next/image';

export default function FloatingTelegramButton() {
  return (
    <a
      href="https://t.me/+E3IHA7NKOtA4MWMx"
      target="_blank"
      rel="noopener noreferrer"
      className="floating-telegram-btn"
      aria-label="Junte-se ao nosso grupo no Telegram"
    >
      <Image
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/2048px-Telegram_logo.svg.png"
        alt="Telegram Logo"
        width={60}
        height={60}
      />
    </a>
  );
}