const params = new URLSearchParams(window.location.search);
const city = (params.get('city') || '').trim();
const normalizedCity = city
  .toLocaleLowerCase('bg-BG')
  .replace(/^(гр\.?|град)\s*/, '')
  .trim();

const message = document.getElementById('thank-you-message');
const isSofia = normalizedCity === 'софия' || normalizedCity === 'sofia';

if (message && city && !isSofia) {
  message.textContent = 'В момента уелнес терапиите се провеждат основно в София. При събиране на повече кандидати е възможно да организираме посещение и във вашия град. Очаквай обаждане от нас, когато се сформира група.';
}
