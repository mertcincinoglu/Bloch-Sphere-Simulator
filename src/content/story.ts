// Story chapters (EN/TR). Conventions match bloch.ts:
// |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩, θ from +Z, φ from +X toward +Y, r = (⟨X⟩, ⟨Y⟩, ⟨Z⟩).
// Source ids refer to SOURCES in sources.ts.

export type Lang = 'en' | 'tr';
export type Figure =
  | { type: 'sphere'; state: { theta: number; phi: number; r?: number }; controls: Array<'theta' | 'phi' | 'purity' | 'gates' | 'measure'>; gates?: string[]; bases?: Array<'Z' | 'X' | 'Y'> }
  | { type: 'compare'; left: { label: string; state: { theta: number; phi: number; r?: number } }; right: { label: string; state: { theta: number; phi: number; r?: number } }; bases: Array<'Z' | 'X' | 'Y'> }
  | { type: 'entangle' } // slider t∈[0,1] for cos(tπ/4)|00⟩+sin(tπ/4)|11⟩; each qubit's arrow = (0,0,cos(tπ/2)), shrinks to the centre
  | { type: 'none' };
export interface Chapter {
  id: string;
  kicker: string;
  title: string;
  lead: string;
  body: string[];
  math?: string;
  figure: Figure;
  caption: string;
  mixup?: { title: string; text: string; source: string };
  sources: string[];
}

const ALL_GATES = ['X', 'Y', 'Z', 'H', 'S', 'T', 'Rx', 'Ry'];

// Figures are language-independent except for labels, so they are built once here.
const FIG = {
  qubit: { type: 'sphere', state: { theta: Math.PI / 2, phi: 0 }, controls: ['theta', 'phi', 'measure'], bases: ['Z', 'X'] },
  angles: { type: 'sphere', state: { theta: Math.PI / 3, phi: Math.PI / 4 }, controls: ['theta', 'phi'] },
  measure: { type: 'sphere', state: { theta: Math.PI / 3, phi: 0 }, controls: ['theta', 'measure'], bases: ['Z'] },
  phase: { type: 'sphere', state: { theta: Math.PI / 2, phi: 0 }, controls: ['phi', 'measure'], bases: ['Z', 'X'] },
  gates: { type: 'sphere', state: { theta: 0, phi: 0 }, controls: ['gates'], gates: ALL_GATES },
  entangle: { type: 'entangle' },
  none: { type: 'none' },
} satisfies Record<string, Figure>;

const PLUS = { theta: Math.PI / 2, phi: 0 };
const CENTRE = { theta: 0, phi: 0, r: 0 };

const en: Chapter[] = [
  {
    id: 'qubit',
    kicker: '§ 1',
    title: 'A coin, and an arrow',
    lead: 'A qubit is not a hidden 0 or 1. It is a direction, and measuring it always returns a single bit.',
    body: [
      'A coin on the table is heads or tails whether or not you look. A classical bit works the same way: it holds a 0 or a 1, and reading it only tells you which.',
      'A qubit is described by an arrow of length one that can point in any direction on a sphere. Straight up is |0⟩, straight down is |1⟩, and every other direction is a superposition of the two.',
      'Ask the qubit “0 or 1?” and you still get one bit back, with odds set by where the arrow points. What the direction adds is not extra answers but a richer set of questions: if the arrow points along +X, the question “+ or −?” has a certain answer, and no coin can imitate that.',
    ],
    math: '|ψ⟩ = α|0⟩ + β|1⟩,   α, β complex,   |α|² + |β|² = 1\nP(0) = |α|²,   P(1) = |β|²',
    figure: FIG.qubit,
    caption: 'Fig. 1 — The arrow starts on +X. Run 1000 shots in Z: about half 0 and half 1, like a fair coin. Now run 1000 shots in X: every shot answers +.',
    mixup: {
      title: '“It is 0 and 1 at once, so it tries every answer in parallel”',
      text: 'A superposition is one definite state, a direction, not a list of values stored side by side. Measuring it yields one bit, so you cannot read out every answer at the end. In Scott Aaronson’s words, quantum computers won’t solve hard problems instantly by just trying all solutions in parallel.',
      source: 'aaronson',
    },
    sources: ['aaronson', 'key-concepts', 'phet'],
  },
  {
    id: 'angles',
    kicker: '§ 2',
    title: 'Two angles are enough',
    lead: 'Every single-qubit state is a point on the sphere, fixed by a tilt θ from the north pole and a turn φ around it.',
    body: [
      'On paper a qubit takes two complex numbers, α and β: four real numbers. Requiring |α|² + |β|² = 1 removes one, and an overall phase that no experiment can detect removes another. Two numbers remain, which is exactly what a point on a sphere needs.',
      'θ is the tilt measured down from +Z, so θ = 0 is |0⟩ and θ = π is |1⟩. φ is the turn around the vertical axis, measured from +X toward +Y: on the equator, φ = 0 is |+⟩ and φ = π/2 is |i⟩.',
      'Notice the halves in the formula: the sphere angle θ enters the state as θ/2. That is why |0⟩ and |1⟩, which are orthogonal (90° apart as state vectors), sit 180° apart on the sphere. On the Bloch sphere, orthogonal always means opposite.',
    ],
    math: '|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩,   0 ≤ θ ≤ π,   0 ≤ φ < 2π\n4 real numbers − 1 (normalisation) − 1 (global phase) = 2 angles\nr = (sin θ cos φ, sin θ sin φ, cos θ) = (⟨X⟩, ⟨Y⟩, ⟨Z⟩)\n|⟨ψ|χ⟩|² = (1 + r_ψ·r_χ)/2,   so ⟨ψ|χ⟩ = 0  ⟺  r_χ = −r_ψ',
    figure: FIG.angles,
    caption: 'Fig. 2 — Drag θ from 0 to π: the arrow travels from |0⟩ to |1⟩ while cos(θ/2) falls from 1 to 0. Then set θ = π/2 and turn φ: the arrow sweeps the equator through |+⟩, |i⟩, |−⟩ and |−i⟩.',
    mixup: {
      title: '“Orthogonal means at right angles”',
      text: 'Students often put |0⟩ and |1⟩ on +Z and +X, because “orthogonal” suggests 90°, and they sometimes start θ or φ from the wrong axis. On the Bloch sphere orthogonal states are diametrically opposite; the halved angle is the reason.',
      source: 'hu-2024',
    },
    sources: ['qiskit', 'qubit-guide', 'ibm-learning', 'qolour-guide', 'hu-2024', 'wikipedia'],
  },
  {
    id: 'measure',
    kicker: '§ 3',
    title: 'Measuring: one shot, then a thousand',
    lead: 'A measurement returns one of two answers with odds set by the arrow, and leaves the arrow on the pole it reported.',
    body: [
      'Measuring in Z asks the qubit “0 or 1?”. The chance of 0 is cos²(θ/2), so the closer the arrow is to the north pole, the likelier 0 becomes. This is the Born rule.',
      'One shot gives one answer, and the arrow jumps to that pole; this jump is called collapse. Measure again in Z and you get the same answer every time, because the state is now |0⟩ or |1⟩.',
      'So a single shot cannot reveal θ. To see the odds you prepare the same state many times and measure each copy once; the histogram of 1000 shots settles close to the predicted split.',
    ],
    math: 'P(0) = |α|² = cos²(θ/2) = (1 + z)/2,   P(1) = sin²(θ/2) = (1 − z)/2\nAny axis n:  P(first outcome) = (1 + r·n)/2 = cos²(γ/2),   γ = angle between r and n\nθ = π/3:  P(0) = 0.75;  1000 shots give about 750 ± 14 zeros',
    figure: FIG.measure,
    caption: 'Fig. 3 — The arrow is tilted 60° from |0⟩, so P(0) = 75%. Fire one shot and watch it snap to a pole; fire again and it stays there. Set θ back to 60°, run 1000 shots and compare the histogram with 75/25.',
    mixup: {
      title: '“Measuring a superposition is always a gamble”',
      text: 'Hu and colleagues found that students often miss when an outcome is certain: exactly when the state is one of the measurement’s two basis states, that is, when the arrow lies along the measurement axis. Every other direction gives odds strictly between 0 and 1.',
      source: 'hu-2024',
    },
    sources: ['hu-2024', 'key-concepts', 'phet', 'qolour-guide'],
  },
  {
    id: 'phase',
    kicker: '§ 4',
    title: 'Phase you can see, and phase you cannot',
    lead: 'A phase on the whole state changes nothing; a phase between |0⟩ and |1⟩ turns the arrow about Z and can be measured.',
    body: [
      'Multiply every amplitude by the same factor e^{iγ} and nothing observable changes: every probability, in every basis, stays put. This global phase is why the sphere needs no third angle.',
      'The relative phase φ between |0⟩ and |1⟩ is different. It spins the arrow around the vertical axis without changing its height, so a Z measurement cannot notice it: |+⟩ and |−⟩ both give 50/50.',
      'Measure in X instead and the two are opposites: |+⟩ answers + every time and |−⟩ answers − every time. States that differ only by a relative phase are different states; you just have to ask the right question.',
    ],
    math: 'e^{iγ}|ψ⟩ and |ψ⟩ give identical probabilities in every basis (global phase)\n|±⟩ = (|0⟩ ± |1⟩)/√2:   P_Z(0) = ½ for both\nP_X(+) = (1 + sin θ cos φ)/2  →  1 for |+⟩ (φ = 0),  0 for |−⟩ (φ = π)',
    figure: FIG.phase,
    caption: 'Fig. 4 — Start at |+⟩ and turn φ: the 1000-shot Z histogram stays at 50/50 all the way round. Switch to X and repeat: the histogram swings from all + at φ = 0 to all − at φ = π.',
    mixup: {
      title: '“A relative phase is just bookkeeping; it can’t be measured”',
      text: 'Wan, Emigh and Shaffer found that many students do not recognise that states differing only by a relative phase are experimentally distinguishable. In Hu and colleagues’ study, telling global from relative phase was the idea that improved least after instruction.',
      source: 'wan-2019',
    },
    sources: ['wan-2019', 'hu-2024', 'quantum-country', 'qolour-guide'],
  },
  {
    id: 'gates',
    kicker: '§ 5',
    title: 'Gates are turns',
    lead: 'Every single-qubit gate turns the arrow rigidly about some axis by some angle.',
    body: [
      'X, Y and Z turn the arrow half a revolution (180°) about their own axes, so X carries |0⟩ to |1⟩. S and T are a quarter turn and an eighth of a turn about Z, so they change only the phase φ.',
      'H is a half turn about the diagonal halfway between +X and +Z. It swaps |0⟩ with |+⟩ and |1⟩ with |−⟩, which is how it turns a Z question into an X question.',
      'A factor of two hides in the matrices. A turn by angle α is written exp(−iα n·σ/2), so the matrix shows α/2 while the arrow moves by α: Rx(π/4) contains cos(π/8) and still turns the arrow 45°.',
    ],
    math: 'R_n(α) = exp(−iα n·σ/2) = cos(α/2) I − i sin(α/2) (n·σ)\nX = i·R_x(π),   Z = i·R_z(π),   H = i·R_{(x+z)/√2}(π)\nS = e^{iπ/4} R_z(π/2),   T = e^{iπ/8} R_z(π/4)   (the prefactors are global phases)\nHZH = X',
    figure: FIG.gates,
    caption: 'Fig. 5 — From |0⟩, apply H, S, S, H: the arrow visits |+⟩, |i⟩ and |−⟩, and lands on |1⟩, just as one X would. Try T eight times for a full circle, and H Z H for another route to X.',
    sources: ['qubit-guide', 'kherb'],
  },
  {
    id: 'mixed',
    kicker: '§ 6',
    title: 'A mix is not a superposition',
    lead: '|+⟩ and a coin-toss mixture of |0⟩ and |1⟩ agree in Z but not in X, and the mixture sits at the centre of the sphere.',
    body: [
      'Prepare |0⟩ or |1⟩ by tossing a fair coin, then forget the result. Measured in Z this gives 50/50, exactly like |+⟩.',
      'The difference shows in X. |+⟩ answers + every time, while the mixture still gives 50/50, because neither |0⟩ nor |1⟩ leans toward + or −. The superposition has a direction; the mixture has none.',
      'On the picture the mixture is the centre, the state ½I with r = (0, 0, 0). States with |r| < 1 fill the inside, the “Bloch ball”, and only pure states lie on the surface. An even mix of |+⟩ and |−⟩ gives the same ½I, and no experiment can tell the two recipes apart.',
    ],
    math: 'ρ = ½(I + r·σ),   |r| ≤ 1,   purity Tr ρ² = (1 + |r|²)/2\n|+⟩⟨+|:  r = (1, 0, 0),  Tr ρ² = 1  (pure)\n½I = ½|0⟩⟨0| + ½|1⟩⟨1| = ½|+⟩⟨+| + ½|−⟩⟨−|:  r = (0, 0, 0),  Tr ρ² = ½',
    figure: { type: 'compare', left: { label: '|+⟩ superposition', state: PLUS }, right: { label: '½I mixture', state: CENTRE }, bases: ['Z', 'X'] },
    caption: 'Fig. 6 — Measure both in Z: two matching 50/50 histograms. Switch to X: the left one jumps to all +, the right one stays at 50/50.',
    mixup: {
      title: '“A superposition just means we don’t know which one it is”',
      text: 'Passante, Emigh and Shaffer found that students from second-year to graduate level could compute probabilities for superpositions, yet failed to recognise that a superposition and a mixed (“lack of knowledge”) state can produce different experimental results.',
      source: 'passante-2015',
    },
    sources: ['passante-2015', 'preskill', 'ibm-learning', 'hu-2024'],
  },
  {
    id: 'entanglement',
    kicker: '§ 7',
    title: 'Where the sphere ends',
    lead: 'When two qubits become entangled, neither has a direction of its own, and each arrow shrinks to the centre.',
    body: [
      'Start with two qubits in |00⟩: two arrows, both pointing up. The slider blends in |11⟩, giving cos(tπ/4)|00⟩ + sin(tπ/4)|11⟩.',
      'As t grows, each arrow shrinks straight down the Z axis, and at t = 1 both sit at the centre. On its own, each qubit now looks exactly like the coin-toss mixture of § 6: 50/50 in every basis.',
      'Yet the pair is in a pure state, and measuring both in Z always gives matching answers. That correlation lives in neither sphere, which is why one sphere per qubit cannot describe an entangled system.',
    ],
    math: '|ψ(t)⟩ = cos(tπ/4)|00⟩ + sin(tπ/4)|11⟩\nρ_A = Tr_B |ψ⟩⟨ψ| = cos²(tπ/4)|0⟩⟨0| + sin²(tπ/4)|1⟩⟨1|\nr_A = r_B = (0, 0, cos(tπ/2)),   Tr ρ_A² = (1 + cos²(tπ/2))/2\nt = 1:  (|00⟩ + |11⟩)/√2,   r_A = r_B = 0',
    figure: FIG.entangle,
    caption: 'Fig. 7 — Slide t from 0 to 1. Both arrows shrink together and vanish at the centre, even though the pair as a whole is still in a pure state.',
    mixup: {
      title: '“One sphere per qubit shows the whole state”',
      text: 'An entangled system of several qubits cannot be described by giving each qubit its own state. A per-qubit view such as Qiskit’s plot_bloch_multivector shows only each qubit’s local expectation values, so a Bell pair looks the same as two unrelated, fully mixed qubits.',
      source: 'key-concepts',
    },
    sources: ['key-concepts', 'qiskit'],
  },
  {
    id: 'limits',
    kicker: '§ 8',
    title: 'What the picture cannot show',
    lead: 'The sphere is a map of one qubit’s states, not a photograph of the qubit.',
    body: [
      'The sphere lives in an abstract space of states, not in the room. Only for a spin-½ particle does the arrow match a real direction, the one along which the spin is certainly up; for a qubit stored in a photon’s polarisation or in an electrical circuit, it points nowhere in the lab.',
      'It is also a one-qubit picture. A system with three levels has no such sphere, and as § 7 showed, several qubits together are not a set of arrows.',
      'Even for one qubit it is not the easiest picture: experts rate it as more likely to cause misunderstandings than some alternatives. Treat it as one view among several, and check it against the numbers.',
      'Time evolution, with the arrow precessing on its own, and decoherence, with the arrow drifting into the ball, are not part of this version; they are coming in a later one.',
    ],
    figure: FIG.none,
    caption: 'Fig. 8 — No figure here. Back in the lab, set the arrow anywhere and ask which of its features an experiment could actually detect.',
    sources: ['key-concepts', 'preskill', 'ibm-learning', 'rasqberry', 'qerimi-2025', 'qolour-guide'],
  },
];

const tr: Chapter[] = [
  {
    id: 'qubit',
    kicker: '§ 1',
    title: 'Bir para, bir ok',
    lead: 'Kübit gizli bir 0 ya da 1 değildir. Bir yöndür ve her ölçüm tek bir bit döndürür.',
    body: [
      'Masadaki bir para, baksan da bakmasan da ya yazıdır ya turadır. Klasik bit de böyle çalışır: 0 ya da 1 tutar, okumak sadece hangisi olduğunu söyler.',
      'Kübit ise uzunluğu bir olan ve kürenin üzerinde her yöne bakabilen bir okla anlatılır. Tam yukarısı |0⟩, tam aşağısı |1⟩; aradaki her yön bu ikisinin bir süperpozisyonudur.',
      'Kübite “0 mı, 1 mi?” diye sorduğunda yine tek bir bit alırsın; olasılıkları okun nereye baktığı belirler. Yönün kazandırdığı şey fazladan cevap değil, daha zengin bir soru kümesidir: ok +X yönündeyse “+ mı, − mi?” sorusunun cevabı kesindir ve hiçbir para bunu taklit edemez.',
    ],
    math: '|ψ⟩ = α|0⟩ + β|1⟩,   α, β karmaşık,   |α|² + |β|² = 1\nP(0) = |α|²,   P(1) = |β|²',
    figure: FIG.qubit,
    caption: 'Şekil 1 — Ok +X yönünde başlıyor. Z’de 1000 atış yap: aşağı yukarı yarısı 0, yarısı 1 çıkar, tıpkı hilesiz bir para gibi. Şimdi X’te 1000 atış yap: her atış + der.',
    mixup: {
      title: '“Aynı anda hem 0 hem 1’dir, bu yüzden bütün cevapları paralel dener”',
      text: 'Süperpozisyon, yan yana saklanan değerlerin listesi değil, belirli tek bir durumdur: bir yön. Ölçüm tek bir bit verir, yani sonunda bütün cevapları okuyamazsın. Scott Aaronson’ın deyişiyle kuantum bilgisayarlar zor problemleri bütün çözümleri paralel deneyerek bir anda çözmez.',
      source: 'aaronson',
    },
    sources: ['aaronson', 'key-concepts', 'phet'],
  },
  {
    id: 'angles',
    kicker: '§ 2',
    title: 'İki açı yeter',
    lead: 'Her tek kübit durumu küre üzerinde bir noktadır: kuzey kutbundan eğim θ ve dikey eksen etrafındaki dönüş φ onu belirler.',
    body: [
      'Kâğıt üzerinde bir kübit iki karmaşık sayıyla, α ve β ile yazılır; bu dört reel sayı demek. |α|² + |β|² = 1 koşulu birini, hiçbir deneyin fark edemediği ortak faz da bir başkasını götürür. Geriye iki sayı kalır, küre üzerindeki bir nokta için de tam bu kadarı gerekir.',
      'θ, +Z’den aşağı doğru ölçülen eğimdir: θ = 0 |0⟩, θ = π ise |1⟩ demektir. φ ise dikey eksen etrafındaki dönüştür ve +X’ten +Y’ye doğru ölçülür: ekvatorda φ = 0 |+⟩, φ = π/2 |i⟩ olur.',
      'Formüldeki yarımlara dikkat et: küredeki θ açısı duruma θ/2 olarak girer. Bu yüzden durum vektörleri olarak dik (aralarında 90°) olan |0⟩ ile |1⟩ kürede 180° uzaktadır. Bloch küresinde dik olmak her zaman tam karşıda olmak demektir.',
    ],
    math: '|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩,   0 ≤ θ ≤ π,   0 ≤ φ < 2π\n4 reel sayı − 1 (normalizasyon) − 1 (global faz) = 2 açı\nr = (sin θ cos φ, sin θ sin φ, cos θ) = (⟨X⟩, ⟨Y⟩, ⟨Z⟩)\n|⟨ψ|χ⟩|² = (1 + r_ψ·r_χ)/2,   yani ⟨ψ|χ⟩ = 0  ⟺  r_χ = −r_ψ',
    figure: FIG.angles,
    caption: 'Şekil 2 — θ’yı 0’dan π’ye sürükle: cos(θ/2) 1’den 0’a inerken ok |0⟩’dan |1⟩’e gider. Sonra θ = π/2 yapıp φ’yi çevir: ok ekvator boyunca |+⟩, |i⟩, |−⟩ ve |−i⟩’den geçer.',
    mixup: {
      title: '“Dik demek aralarında 90° var demek”',
      text: 'Öğrenciler “dik” sözcüğü 90° çağrıştırdığı için |0⟩ ile |1⟩’i çoğu zaman +Z ve +X’e yerleştiriyor, bazen de θ’yı ya da φ’yi yanlış eksenden başlatıyor. Bloch küresinde dik durumlar tam karşıt uçlardadır; nedeni yarıya bölünen açıdır.',
      source: 'hu-2024',
    },
    sources: ['qiskit', 'qubit-guide', 'ibm-learning', 'qolour-guide', 'hu-2024', 'wikipedia'],
  },
  {
    id: 'measure',
    kicker: '§ 3',
    title: 'Ölçmek: önce bir atış, sonra bin',
    lead: 'Ölçüm, olasılıkları okun belirlediği iki cevaptan birini verir ve oku bildirdiği kutba bırakır.',
    body: [
      'Z’de ölçmek kübite “0 mı, 1 mi?” diye sormaktır. 0 çıkma olasılığı cos²(θ/2)’dir; ok kuzey kutbuna ne kadar yakınsa 0 o kadar olasıdır. Buna Born kuralı denir.',
      'Tek atış tek bir cevap verir ve ok o kutba sıçrar; bu sıçramaya çöküş denir. Z’de yeniden ölçersen her seferinde aynı cevabı alırsın, çünkü durum artık |0⟩ ya da |1⟩’dir.',
      'Demek ki tek bir atış θ’yı ortaya koyamaz. Olasılıkları görmek için aynı durumu defalarca hazırlar, her kopyayı bir kez ölçersin; 1000 atışın histogramı öngörülen dağılımın yakınına oturur.',
    ],
    math: 'P(0) = |α|² = cos²(θ/2) = (1 + z)/2,   P(1) = sin²(θ/2) = (1 − z)/2\nHerhangi bir n ekseni:  P(ilk sonuç) = (1 + r·n)/2 = cos²(γ/2),   γ = r ile n arasındaki açı\nθ = π/3:  P(0) = 0,75;  1000 atışta yaklaşık 750 ± 14 tane 0',
    figure: FIG.measure,
    caption: 'Şekil 3 — Ok |0⟩’dan 60° eğik, yani P(0) = %75. Bir atış yap ve okun bir kutba oturmasını izle; bir daha ölç, orada kalır. θ’yı yeniden 60°’ye getir, 1000 atış yap ve histogramı 75/25 ile karşılaştır.',
    mixup: {
      title: '“Süperpozisyonu ölçmek her zaman şansa kalmıştır”',
      text: 'Hu ve arkadaşları, öğrencilerin bir sonucun ne zaman kesin olduğunu çoğu zaman kaçırdığını buldu: durum, ölçümün iki taban durumundan biriyse, yani ok ölçüm ekseni üzerindeyse. Diğer bütün yönlerde olasılık 0 ile 1 arasında kalır.',
      source: 'hu-2024',
    },
    sources: ['hu-2024', 'key-concepts', 'phet', 'qolour-guide'],
  },
  {
    id: 'phase',
    kicker: '§ 4',
    title: 'Görünen faz, görünmeyen faz',
    lead: 'Bütün duruma eklenen faz hiçbir şeyi değiştirmez; |0⟩ ile |1⟩ arasındaki faz ise oku Z etrafında döndürür ve ölçülebilir.',
    body: [
      'Bütün genlikleri aynı e^{iγ} çarpanıyla çarparsan gözlenebilir hiçbir şey değişmez: her tabanda her olasılık yerinde kalır. Kürenin üçüncü bir açıya ihtiyaç duymamasının nedeni bu global fazdır.',
      '|0⟩ ile |1⟩ arasındaki bağıl faz φ ise başka bir şeydir. Oku yüksekliğini değiştirmeden dikey eksen etrafında döndürür, bu yüzden Z ölçümü onu fark edemez: |+⟩ da |−⟩ da 50/50 verir.',
      'Bunun yerine X’te ölçersen ikisi birbirinin tersidir: |+⟩ her seferinde +, |−⟩ her seferinde − der. Yalnızca bağıl fazı farklı olan durumlar gerçekten farklı durumlardır; doğru soruyu sorman yeter.',
    ],
    math: 'e^{iγ}|ψ⟩ ile |ψ⟩ her tabanda aynı olasılıkları verir (global faz)\n|±⟩ = (|0⟩ ± |1⟩)/√2:   ikisi için de P_Z(0) = ½\nP_X(+) = (1 + sin θ cos φ)/2  →  |+⟩ için 1 (φ = 0),  |−⟩ için 0 (φ = π)',
    figure: FIG.phase,
    caption: 'Şekil 4 — |+⟩’dan başla ve φ’yi çevir: 1000 atışlık Z histogramı tur boyunca 50/50’de kalır. X’e geçip tekrarla: histogram φ = 0’da hep +’dan φ = π’de hep −’ye kayar.',
    mixup: {
      title: '“Bağıl faz sadece bir hesap ayrıntısı, ölçülemez”',
      text: 'Wan, Emigh ve Shaffer, öğrencilerin çoğunun yalnızca bağıl fazı farklı olan durumların deneyde ayırt edilebildiğini fark etmediğini buldu. Hu ve arkadaşlarının çalışmasında da global fazı bağıl fazdan ayırmak, dersten sonra en az gelişen kavramdı.',
      source: 'wan-2019',
    },
    sources: ['wan-2019', 'hu-2024', 'quantum-country', 'qolour-guide'],
  },
  {
    id: 'gates',
    kicker: '§ 5',
    title: 'Kapılar dönüşlerdir',
    lead: 'Her tek kübit kapısı oku, şeklini bozmadan, bir eksen etrafında belli bir açı kadar döndürür.',
    body: [
      'X, Y ve Z oku kendi eksenleri etrafında yarım tur (180°) döndürür; X bu yüzden |0⟩’ı |1⟩’e taşır. S ve T, Z etrafında çeyrek ve sekizde bir turdur, dolayısıyla yalnızca φ fazını değiştirir.',
      'H, +X ile +Z’nin tam ortasındaki köşegen eksen etrafında yarım turdur. |0⟩ ile |+⟩’yı, |1⟩ ile |−⟩’yi yer değiştirir; Z sorusunu X sorusuna böyle çevirir.',
      'Matrislerde gizli bir 2 çarpanı var. α açısı kadar bir dönüş exp(−iα n·σ/2) diye yazılır, yani matriste α/2 görünürken ok α kadar döner: Rx(π/4) içinde cos(π/8) vardır ama oku 45° çevirir.',
    ],
    math: 'R_n(α) = exp(−iα n·σ/2) = cos(α/2) I − i sin(α/2) (n·σ)\nX = i·R_x(π),   Z = i·R_z(π),   H = i·R_{(x+z)/√2}(π)\nS = e^{iπ/4} R_z(π/2),   T = e^{iπ/8} R_z(π/4)   (öndeki çarpanlar global fazdır)\nHZH = X',
    figure: FIG.gates,
    caption: 'Şekil 5 — |0⟩’dan başlayıp sırayla H, S, S, H uygula: ok |+⟩, |i⟩ ve |−⟩’den geçip |1⟩’e varır, tek bir X’in yaptığı gibi. T’yi sekiz kez uygulayıp tam turu, H Z H ile de X’e giden ikinci yolu dene.',
    sources: ['qubit-guide', 'kherb'],
  },
  {
    id: 'mixed',
    kicker: '§ 6',
    title: 'Karışım süperpozisyon değildir',
    lead: '|+⟩ ile |0⟩ ve |1⟩’in yazı-tura karışımı Z’de aynı, X’te farklı sonuç verir; karışım kürenin merkezindedir.',
    body: [
      'Hilesiz bir para at, sonuca göre |0⟩ ya da |1⟩ hazırla ve sonucu unut. Bu karışık durum Z’de ölçülünce 50/50 verir, tıpkı |+⟩ gibi.',
      'Fark X’te ortaya çıkar. |+⟩ her seferinde + der, karışım ise yine 50/50 verir, çünkü ne |0⟩ ne de |1⟩ + ya da − tarafına yatkındır. Süperpozisyonun bir yönü vardır; karışımın yoktur.',
      'Resimde karışım merkezdeki noktadır: r = (0, 0, 0) olan ½I durumu. |r| < 1 olan durumlar kürenin içini, yani “Bloch topunu” doldurur; yüzeyde yalnızca saf durumlar bulunur. |+⟩ ile |−⟩’nin eşit karışımı da aynı ½I’yı verir ve hiçbir deney bu iki tarifi birbirinden ayıramaz.',
    ],
    math: 'ρ = ½(I + r·σ),   |r| ≤ 1,   saflık Tr ρ² = (1 + |r|²)/2\n|+⟩⟨+|:  r = (1, 0, 0),  Tr ρ² = 1  (saf)\n½I = ½|0⟩⟨0| + ½|1⟩⟨1| = ½|+⟩⟨+| + ½|−⟩⟨−|:  r = (0, 0, 0),  Tr ρ² = ½',
    figure: { type: 'compare', left: { label: '|+⟩ süperpozisyon', state: PLUS }, right: { label: '½I karışım', state: CENTRE }, bases: ['Z', 'X'] },
    caption: 'Şekil 6 — İkisini de Z’de ölç: birbirinin aynı iki 50/50 histogram. X’e geç: soldaki tamamen +’ya çıkar, sağdaki 50/50’de kalır.',
    mixup: {
      title: '“Süperpozisyon, hangisi olduğunu bilmiyoruz demektir”',
      text: 'Passante, Emigh ve Shaffer, ikinci sınıftan lisansüstüne kadar öğrencilerin süperpozisyon için olasılık hesaplayabildiğini, ama bir süperpozisyonla karışık (“bilgi eksikliği”) bir durumun farklı deney sonuçları verebileceğini fark edemediğini buldu.',
      source: 'passante-2015',
    },
    sources: ['passante-2015', 'preskill', 'ibm-learning', 'hu-2024'],
  },
  {
    id: 'entanglement',
    kicker: '§ 7',
    title: 'Kürenin bittiği yer',
    lead: 'İki kübit dolanık hale gelince hiçbirinin kendine ait bir yönü kalmaz ve iki ok da merkeze doğru kısalır.',
    body: [
      'İki kübitle |00⟩ durumunda başla: iki ok, ikisi de yukarı bakıyor. Kaydırıcı işin içine |11⟩’i katar ve cos(tπ/4)|00⟩ + sin(tπ/4)|11⟩ durumunu verir.',
      't büyüdükçe iki ok da Z ekseni boyunca kısalır ve t = 1’de ikisi de merkeze oturur. Tek başına bakıldığında her kübit artık § 6’daki yazı-tura karışımının aynısıdır: her tabanda 50/50.',
      'Oysa çift bir bütün olarak saf bir durumdadır ve ikisi de Z’de ölçüldüğünde cevaplar hep aynı çıkar. Bu bağıntı iki kürenin hiçbirinde görünmez; dolanık bir sistemi her kübite bir küre çizerek anlatamamanın nedeni budur.',
    ],
    math: '|ψ(t)⟩ = cos(tπ/4)|00⟩ + sin(tπ/4)|11⟩\nρ_A = Tr_B |ψ⟩⟨ψ| = cos²(tπ/4)|0⟩⟨0| + sin²(tπ/4)|1⟩⟨1|\nr_A = r_B = (0, 0, cos(tπ/2)),   Tr ρ_A² = (1 + cos²(tπ/2))/2\nt = 1:  (|00⟩ + |11⟩)/√2,   r_A = r_B = 0',
    figure: FIG.entangle,
    caption: 'Şekil 7 — t’yi 0’dan 1’e kaydır. İki ok birlikte kısalıp merkezde kaybolur, oysa çift bir bütün olarak hâlâ saf bir durumdadır.',
    mixup: {
      title: '“Her kübite bir küre çizmek durumun tamamını gösterir”',
      text: 'Birden çok kübitten oluşan dolanık bir sistem, her kübite ayrı bir durum verilerek tarif edilemez. Qiskit’in plot_bloch_multivector çizimi gibi kübit başına görünümler yalnızca her kübitin yerel beklenen değerlerini gösterir; bu yüzden bir Bell çifti, birbiriyle ilgisiz iki tamamen karışık kübitle aynı görünür.',
      source: 'key-concepts',
    },
    sources: ['key-concepts', 'qiskit'],
  },
  {
    id: 'limits',
    kicker: '§ 8',
    title: 'Resmin gösteremedikleri',
    lead: 'Küre, bir kübitin durumlarının haritasıdır; kübitin fotoğrafı değildir.',
    body: [
      'Küre odada değil, durumların soyut uzayında yaşar. Ok yalnızca spin-½ parçacıkta gerçek bir yöne karşılık gelir: spinin kesinlikle yukarı çıktığı yöne. Fotonun kutuplanmasında ya da bir elektrik devresinde saklanan kübitte ise laboratuvarda hiçbir yeri göstermez.',
      'Üstelik bu tek kübitlik bir resimdir. Üç seviyeli bir sistemin böyle bir küresi yoktur ve § 7’de gördüğümüz gibi birden çok kübit bir ok kümesi değildir.',
      'Tek kübit için bile en kolay resim değildir: uzmanlar onu bazı başka gösterimlere göre yanlış anlamaya daha açık buluyor. Onu birkaç bakış açısından biri olarak gör ve sayılarla karşılaştır.',
      'Zamanla değişim (okun kendiliğinden dönmesi) ve dekoherans (okun topun içine kayması) bu sürümde yok; sonraki bir sürümde gelecek.',
    ],
    figure: FIG.none,
    caption: 'Şekil 8 — Burada şekil yok. Laboratuvara dön, oku herhangi bir yöne getir ve sor: bu okun hangi özelliğini bir deney gerçekten görebilir?',
    sources: ['key-concepts', 'preskill', 'ibm-learning', 'rasqberry', 'qerimi-2025', 'qolour-guide'],
  },
];

export const STORY: Record<Lang, Chapter[]> = { en, tr };
