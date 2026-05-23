/**
 * FIFA World Cup 2026 — Team & Group Data
 * 48 teams across 12 groups (A–L)
 * Utiliza links oficiais em SVG (Globo) quando disponíveis
 */

const TEAMS = {
  // ── Group A ──
  mex: { id: "mex", name: "México", group: "A", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/15/México.svg" },
  rsa: { id: "rsa", name: "África do Sul", group: "A", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/09/África_do_Sul.svg" },
  kor: { id: "kor", name: "Coreia do Sul", group: "A", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/01/Coreia_do_Sul.svg" },
  cze: { id: "cze", name: "Rep. Tcheca", group: "A", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2025/02/19/Rep._Tcheca-30_1TI2lSl.png" },

  // ── Group B ──
  can: { id: "can", name: "Canadá", group: "B", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/15/Canadá.svg" },
  sui: { id: "sui", name: "Suíça", group: "B", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/15/Suíça.svg" },
  qat: { id: "qat", name: "Catar", group: "B", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/06/Catar.svg" },
  bih: { id: "bih", name: "Bósnia", group: "B", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/15/Bósnia-30.png" },

  // ── Group C ──
  bra: { id: "bra", name: "Brasil", group: "C", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/16/Brasil_rgYHF6Z.svg" },
  mar: { id: "mar", name: "Marrocos", group: "C", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/10/Marrocos.svg" },
  sco: { id: "sco", name: "Escócia", group: "C", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/15/Escócia.svg" },
  hai: { id: "hai", name: "Haiti", group: "C", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/07/14/Haiti.svg" },

  // ── Group D ──
  usa: { id: "usa", name: "Estados Unidos", group: "D", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/16/Estados_Unidos.svg" },
  par: { id: "par", name: "Paraguai", group: "D", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/07/15/Paraguai.svg" },
  aus: { id: "aus", name: "Austrália", group: "D", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/02/Australia.svg" },
  tur: { id: "tur", name: "Turquia", group: "D", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2024/04/16/Turquia-30.png" },

  // ── Group E ──
  ger: { id: "ger", name: "Alemanha", group: "E", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/Alemanha.svg" },
  ecu: { id: "ecu", name: "Equador", group: "E", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/15/Equador.svg" },
  civ: { id: "civ", name: "Costa do Marfim", group: "E", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/03/Costa_do_Marfim.svg" },
  cur: { id: "cur", name: "Curaçao", group: "E", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/07/14/Curaçao.svg" },

  // ── Group F ──
  ned: { id: "ned", name: "Holanda", group: "F", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/16/Holanda.svg" },
  jpn: { id: "jpn", name: "Japão", group: "F", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/Japao.svg" },
  tun: { id: "tun", name: "Tunísia", group: "F", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2018/03/10/tunisia.svg" },
  swe: { id: "swe", name: "Suécia", group: "F", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2025/07/22/Suécia-30.png" },

  // ── Group G ──
  bel: { id: "bel", name: "Bélgica", group: "G", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/15/Bélgica.svg" },
  irn: { id: "irn", name: "Irã", group: "G", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/01/Irã.svg" },
  egy: { id: "egy", name: "Egito", group: "G", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/08/Egito.svg" },
  nzl: { id: "nzl", name: "Nova Zelândia", group: "G", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/01/Nova_Zelandia.svg" },

  // ── Group H ──
  esp: { id: "esp", name: "Espanha", group: "H", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/Espanha.svg" },
  uru: { id: "uru", name: "Uruguai", group: "H", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/16/Uruguai.svg" },
  ksa: { id: "ksa", name: "Arábia Saudita", group: "H", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/05/Arábia_Saudita.svg" },
  cpv: { id: "cpv", name: "Cabo Verde", group: "H", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/08/Cabo_Verde.svg" },

  // ── Group I ──
  fra: { id: "fra", name: "França", group: "I", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/França.svg" },
  nor: { id: "nor", name: "Noruega", group: "I", pot: 2, svg: "https://s.sde.globo.com/media/organizations/2019/09/15/Noruega.svg" },
  sen: { id: "sen", name: "Senegal", group: "I", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/Senegal.svg" },
  irq: { id: "irq", name: "Iraque", group: "I", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/07/Iraque-65.png" },

  // ── Group J ──
  arg: { id: "arg", name: "Argentina", group: "J", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/15/Argentina.svg" },
  aut: { id: "aut", name: "Áustria", group: "J", pot: 2, svg: "https://s.sde.globo.com/media/organizations/2019/09/17/Áustria.svg" },
  alg: { id: "alg", name: "Argélia", group: "J", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/08/Argélia.svg" },
  jor: { id: "jor", name: "Jordânia", group: "J", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/03/Jordania.svg" },

  // ── Group K ──
  por: { id: "por", name: "Portugal", group: "K", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/17/Portugal.svg" },
  col: { id: "col", name: "Colômbia", group: "K", pot: 2, svg: "https://s.sde.globo.com/media/organizations/2019/07/14/Colombia.svg" },
  uzb: { id: "uzb", name: "Uzbequistão", group: "K", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/08/Uzbequistão.svg" },
  cod: { id: "cod", name: "RD Congo", group: "K", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/10/RD_Congo-30.png" },

  // ── Group L ──
  eng: { id: "eng", name: "Inglaterra", group: "L", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/13/Inglaterra.svg" },
  cro: { id: "cro", name: "Croácia", group: "L", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/16/Croácia.svg" },
  gha: { id: "gha", name: "Gana", group: "L", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/08/Gana.svg" },
  pan: { id: "pan", name: "Panamá", group: "L", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/07/16/Panamá.svg" },
};

const GROUP_NAMES = ["A","B","C","D","E","F","G","H","I","J","K","L"];

const GROUPS = {};
GROUP_NAMES.forEach(g => {
  GROUPS[g] = Object.values(TEAMS).filter(t => t.group === g);
});

/**
 * Returns flag image URL or null for placeholder
 */
function getFlagUrl(team) {
  return team.svg || null;
}
