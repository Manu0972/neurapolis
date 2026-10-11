import { describe, expect, it } from 'vitest';
import { mulberry32, rngNext } from '../src/core/rng';
import { rngPour } from '../src/simulation/world/seed';

/* si ce test échoue, la compatibilité des mondes sauvegardés est cassée ; ne pas simplement mettre à jour les valeurs */

describe('Vecteurs de référence figés pour PRNG et dérivation de graines (rngPour)', () => {
  it('garantit la stabilité des 8 premiers nombres pour mulberry32 avec graine fixe', () => {
    const state = mulberry32(42);
    const resultats: number[] = [];
    for (let i = 0; i < 8; i++) {
      resultats.push(rngNext(state));
    }

    const valeursAttendues = [
      0.2687103282660246,
      0.9705917823594064,
      0.15573715115897357,
      0.548480749828741,
      0.5413349603768438,
      0.6558197771664709,
      0.6860368803609163,
      0.722915830090642,
    ];

    expect(resultats).toEqual(valeursAttendues);
  });

  it('garantit la stabilité des 8 premiers nombres pour rngPour sur 5 chemins figés', () => {
    const cheminsFixes = [
      'monde',
      'monde/pays-1',
      'monde/pays-1/ville-3',
      'monde/pays-1/ville-3/cohorte-2',
      'monde/pays-1/ville-3/cohorte-2/individu-7',
    ];

    const vecteursAttendus: Record<string, number[]> = {
      'monde': [
        0.8306003753095865,
        0.007683935575187206,
        0.8358448762446642,
        0.2862354728858918,
        0.04639908159151673,
        0.5186835338827223,
        0.5847427847329527,
        0.4735282496549189,
      ],
      'monde/pays-1': [
        0.1872166646644473,
        0.21952219493687153,
        0.05282688001170754,
        0.590467807603999,
        0.8659102376550436,
        0.6698650638572872,
        0.3957297920715064,
        0.2741913164499804,
      ],
      'monde/pays-1/ville-3': [
        0.14154425682500005,
        0.26122591691091657,
        0.41916369763202965,
        0.6517178728245199,
        0.9859239843208343,
        0.9304383406415582,
        0.7582236940506846,
        0.6548480370547622,
      ],
      'monde/pays-1/ville-3/cohorte-2': [
        0.6433544522151351,
        0.04273205762729049,
        0.8037380296736956,
        0.07684074225835505,
        0.35414639534428716,
        0.49079527193680406,
        0.1557929420378059,
        0.573219207348302,
      ],
      'monde/pays-1/ville-3/cohorte-2/individu-7': [
        0.14912953251041472,
        0.9080766336992383,
        0.7494420791044831,
        0.938838634872809,
        0.4578502213116735,
        0.20392372575588524,
        0.816408250015229,
        0.20521406852640212,
      ],
    };

    for (const chemin of cheminsFixes) {
      const prng = rngPour(chemin);
      const nombres: number[] = [];
      for (let i = 0; i < 8; i++) {
        nombres.push(prng.next());
      }
      expect(nombres).toEqual(vecteursAttendus[chemin]);
    }
  });
});
