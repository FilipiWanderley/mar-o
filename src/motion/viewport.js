// Altura de tela estável. No celular a barra de endereço aparece e some durante a rolagem e
// muda o innerHeight; se os trechos presos usassem esse valor, a página mudaria de tamanho
// no meio da rolagem e "pularia". Aqui a altura só muda quando a largura muda (girar a tela).
let vh = innerHeight, vw = innerWidth;
export const stableVH = () => vh;
export function onWidthChange(fn) {
  addEventListener('resize', () => {
    if (innerWidth === vw) return;
    vw = innerWidth; vh = innerHeight;
    fn();
  });
}
addEventListener('orientationchange', () => setTimeout(() => { vw = innerWidth; vh = innerHeight; }, 300));
