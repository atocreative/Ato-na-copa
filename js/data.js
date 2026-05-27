/**
 * FIFA World Cup 2026 — Team & Group Data
 * 48 teams across 12 groups (A–L)
 * Utiliza links oficiais em SVG (Globo) quando disponíveis
 */

const TEAMS = {
  // ── Group A ──
  mex: { id: "mex", abbr: "MEX", name: "México", group: "A", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/15/México.svg" },
  rsa: { id: "rsa", abbr: "AFS", name: "África do Sul", group: "A", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/09/África_do_Sul.svg" },
  kor: { id: "kor", abbr: "COR", name: "Coreia do Sul", group: "A", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/01/Coreia_do_Sul.svg" },
  cze: { id: "cze", abbr: "TCH", name: "Rep. Tcheca", group: "A", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2025/02/19/Rep._Tcheca-30_1TI2lSl.png" },

  // ── Group B ──
  can: { id: "can", abbr: "CAN", name: "Canadá", group: "B", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/15/Canadá.svg" },
  sui: { id: "sui", abbr: "SUI", name: "Suíça", group: "B", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/15/Suíça.svg" },
  qat: { id: "qat", abbr: "CAT", name: "Catar", group: "B", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/06/Catar.svg" },
  bih: { id: "bih", abbr: "BOS", name: "Bósnia", group: "B", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/15/Bósnia-30.png" },

  // ── Group C ──
  bra: { id: "bra", abbr: "BRA", name: "Brasil", group: "C", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/16/Brasil_rgYHF6Z.svg" },
  mar: { id: "mar", abbr: "MAR", name: "Marrocos", group: "C", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/10/Marrocos.svg" },
  sco: { id: "sco", abbr: "ESC", name: "Escócia", group: "C", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/15/Escócia.svg" },
  hai: { id: "hai", abbr: "HAI", name: "Haiti", group: "C", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/07/14/Haiti.svg" },

  // ── Group D ──
  usa: { id: "usa", abbr: "EUA", name: "Estados Unidos", group: "D", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/16/Estados_Unidos.svg" },
  par: { id: "par", abbr: "PAR", name: "Paraguai", group: "D", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/07/15/Paraguai.svg" },
  aus: { id: "aus", abbr: "AUS", name: "Austrália", group: "D", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/02/Australia.svg" },
  tur: { id: "tur", abbr: "TUR", name: "Turquia", group: "D", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2024/04/16/Turquia-30.png" },

  // ── Group E ──
  ger: { id: "ger", abbr: "ALE", name: "Alemanha", group: "E", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/Alemanha.svg" },
  ecu: { id: "ecu", abbr: "EQU", name: "Equador", group: "E", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/15/Equador.svg" },
  civ: { id: "civ", abbr: "CDM", name: "Costa do Marfim", group: "E", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/03/Costa_do_Marfim.svg" },
  cur: { id: "cur", abbr: "CUR", name: "Curaçao", group: "E", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/07/14/Curaçao.svg" },

  // ── Group F ──
  ned: { id: "ned", abbr: "HOL", name: "Holanda", group: "F", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/16/Holanda.svg" },
  jpn: { id: "jpn", abbr: "JAP", name: "Japão", group: "F", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/Japao.svg" },
  tun: { id: "tun", abbr: "TUN", name: "Tunísia", group: "F", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2018/03/10/tunisia.svg" },
  swe: { id: "swe", abbr: "SUE", name: "Suécia", group: "F", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2025/07/22/Suécia-30.png" },

  // ── Group G ──
  bel: { id: "bel", abbr: "BEL", name: "Bélgica", group: "G", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/15/Bélgica.svg" },
  irn: { id: "irn", abbr: "IRA", name: "Irã", group: "G", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/01/Irã.svg" },
  egy: { id: "egy", abbr: "EGI", name: "Egito", group: "G", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/08/Egito.svg" },
  nzl: { id: "nzl", abbr: "NZL", name: "Nova Zelândia", group: "G", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/01/Nova_Zelandia.svg" },

  // ── Group H ──
  esp: { id: "esp", abbr: "ESP", name: "Espanha", group: "H", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/Espanha.svg" },
  uru: { id: "uru", abbr: "URU", name: "Uruguai", group: "H", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/16/Uruguai.svg" },
  ksa: { id: "ksa", abbr: "ARA", name: "Arábia Saudita", group: "H", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/05/Arábia_Saudita.svg" },
  cpv: { id: "cpv", abbr: "CBV", name: "Cabo Verde", group: "H", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/08/Cabo_Verde.svg" },

  // ── Group I ──
  fra: { id: "fra", abbr: "FRA", name: "França", group: "I", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/França.svg" },
  nor: { id: "nor", abbr: "NOR", name: "Noruega", group: "I", pot: 2, svg: "https://s.sde.globo.com/media/organizations/2019/09/15/Noruega.svg" },
  sen: { id: "sen", abbr: "SEN", name: "Senegal", group: "I", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/03/Senegal.svg" },
  irq: { id: "irq", abbr: "IRQ", name: "Iraque", group: "I", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/07/Iraque-65.png" },

  // ── Group J ──
  arg: { id: "arg", abbr: "ARG", name: "Argentina", group: "J", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/07/15/Argentina.svg" },
  aut: { id: "aut", abbr: "AUT", name: "Áustria", group: "J", pot: 2, svg: "https://s.sde.globo.com/media/organizations/2019/09/17/Áustria.svg" },
  alg: { id: "alg", abbr: "ALG", name: "Argélia", group: "J", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/08/Argélia.svg" },
  jor: { id: "jor", abbr: "JOR", name: "Jordânia", group: "J", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/03/Jordania.svg" },

  // ── Group K ──
  por: { id: "por", abbr: "POR", name: "Portugal", group: "K", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/17/Portugal.svg" },
  col: { id: "col", abbr: "COL", name: "Colômbia", group: "K", pot: 2, svg: "https://s.sde.globo.com/media/organizations/2019/07/14/Colombia.svg" },
  uzb: { id: "uzb", abbr: "UZB", name: "Uzbequistão", group: "K", pot: 3, svg: "https://s.sde.globo.com/media/organizations/2019/09/08/Uzbequistão.svg" },
  cod: { id: "cod", abbr: "RDC", name: "RD Congo", group: "K", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/09/10/RD_Congo-30.png" },

  // ── Group L ──
  eng: { id: "eng", abbr: "ING", name: "Inglaterra", group: "L", pot: 1, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/13/Inglaterra.svg" },
  cro: { id: "cro", abbr: "CRO", name: "Croácia", group: "L", pot: 2, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/16/Croácia.svg" },
  gha: { id: "gha", abbr: "GAN", name: "Gana", group: "L", pot: 3, svg: "https://s.glbimg.com/es/sde/f/organizacoes/2019/09/08/Gana.svg" },
  pan: { id: "pan", abbr: "PAN", name: "Panamá", group: "L", pot: 4, svg: "https://s.sde.globo.com/media/organizations/2019/07/16/Panamá.svg" },
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
