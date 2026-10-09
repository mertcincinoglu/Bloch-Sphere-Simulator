// Reference list. Metadata copied from research/sources/*.md (status: included); URLs checked 2026-10-09.
// "n.d." = the source gives no publication date.

export interface Source { id: string; group: 'theory' | 'teaching' | 'research' | 'tools'; authors: string; title: string; venue: string; year: string; url: string; note: { en: string; tr: string } }

export const SOURCES: Source[] = [
  // Theory
  {
    id: 'nielsen-chuang', group: 'theory',
    authors: 'Michael A. Nielsen, Isaac L. Chuang', title: 'Quantum Computation and Quantum Information (10th Anniversary Edition)', venue: 'Cambridge University Press', year: '2010',
    url: 'https://www.cambridge.org/highereducation/books/quantum-computation-and-quantum-information/01E10196D0A682A6AEFFEA52D53BE9AE',
    note: {
      en: 'The standard textbook; §1.2 introduces the single qubit and the Bloch sphere used throughout this apparatus.',
      tr: 'Alanın standart ders kitabı; §1.2 bu aparatın her yerinde kullanılan tek kübiti ve Bloch küresini tanıtır.',
    },
  },
  {
    id: 'ibm-learning', group: 'theory',
    authors: 'John Watrous', title: 'General formulation of quantum information: Bloch sphere', venue: 'IBM Quantum Learning', year: 'n.d.',
    url: 'https://quantum.cloud.ibm.com/learning/en/courses/general-formulation-of-quantum-information/density-matrices/bloch-sphere',
    note: {
      en: 'A careful course page on the Bloch sphere and Bloch ball, including why ½I can be written as more than one mixture.',
      tr: 'Bloch küresini ve Bloch topunu özenle anlatan, ½I’nın neden birden çok karışım olarak yazılabildiğini de gösteren kurs sayfası.',
    },
  },
  {
    id: 'qubit-guide', group: 'theory',
    authors: 'Artur Ekert, Tim Hosgood, Alastair Kay, Chiara Macchiavello', title: 'Introduction to Quantum Information Science, §2.10 The Bloch sphere', venue: 'qubit.guide (free online textbook)', year: '2025',
    url: 'https://qubit.guide/2.10-the-bloch-sphere.html',
    note: {
      en: 'Free textbook section showing that orthogonal states are antipodal and that a unitary’s eigenvectors and eigenvalues give the rotation axis and angle.',
      tr: 'Dik durumların zıt uçlarda olduğunu ve bir üniterin öz vektörleri ile öz değerlerinin dönüş eksenini ve açısını verdiğini gösteren ücretsiz ders kitabı bölümü.',
    },
  },
  {
    id: 'preskill', group: 'theory',
    authors: 'John Preskill', title: 'Lecture Notes for Ph219/CS219, Chapter 2: Foundations I: States and Ensembles', venue: 'Caltech', year: 'n.d.',
    url: 'https://www.preskill.caltech.edu/ph219/chap2_15.pdf',
    note: {
      en: 'Graduate lecture notes deriving ρ = ½(I + n·σ) and showing that different preparations of ½I cannot be told apart.',
      tr: 'ρ = ½(I + n·σ) ifadesini türeten ve ½I’nın farklı hazırlanışlarının ayırt edilemeyeceğini gösteren lisansüstü ders notları.',
    },
  },
  {
    id: 'wikipedia', group: 'theory',
    authors: 'Wikipedia contributors', title: 'Bloch sphere', venue: 'Wikipedia', year: 'n.d.',
    url: 'https://en.wikipedia.org/wiki/Bloch_sphere',
    note: {
      en: 'A quick entry point with the standard formulas and links onward; good for orientation, not as a final authority.',
      tr: 'Standart formülleri ve devam bağlantılarını veren hızlı bir giriş noktası; yön bulmak için iyi, son söz olarak değil.',
    },
  },

  // Teaching
  {
    id: 'key-concepts', group: 'teaching',
    authors: 'NSF Q-12 / University of Illinois workshop', title: 'Key Concepts for Future QIS Learners', venue: 'NSF / OSTP workshop report', year: '2020',
    url: 'https://qis-learners.research.illinois.edu/',
    note: {
      en: 'A short national framework of what every quantum learner should know, from states as directions in an abstract space to entanglement and decoherence.',
      tr: 'Durumların soyut bir uzaydaki yönler olmasından dolanıklık ve dekoheransa kadar her kuantum öğrencisinin bilmesi gerekenleri sıralayan kısa ulusal çerçeve.',
    },
  },
  {
    id: 'aaronson', group: 'teaching',
    authors: 'Scott Aaronson', title: 'Shtetl-Optimized (blog masthead)', venue: 'Shtetl-Optimized blog', year: 'n.d.',
    url: 'https://scottaaronson.blog/?p=2464',
    note: {
      en: 'A complexity theorist’s standing warning that quantum computers do not solve hard problems by trying all solutions in parallel.',
      tr: 'Bir karmaşıklık kuramcısının, kuantum bilgisayarların zor problemleri bütün çözümleri paralel deneyerek çözmediğine dair kalıcı uyarısı.',
    },
  },
  {
    id: 'quantum-country', group: 'teaching',
    authors: 'Andy Matuschak, Michael A. Nielsen', title: 'Quantum computing for the very curious', venue: 'quantum.country', year: '2019',
    url: 'https://quantum.country/qcvc',
    note: {
      en: 'A patient essay on qubits and gates by one of the field’s textbook authors, including why a global phase has no effect on results.',
      tr: 'Alanın temel ders kitabının yazarlarından birinin ortak yazdığı, kübitleri ve kapıları sabırla anlatan, global fazın sonuçları neden etkilemediğini de gösteren bir deneme.',
    },
  },
  {
    id: 'qolour-guide', group: 'teaching',
    authors: 'Sohum Thakkar (Qolour)', title: 'What is the Bloch sphere?', venue: 'Qolour guides', year: '2026',
    url: 'https://www.qolour.com/guides/what-is-the-bloch-sphere',
    note: {
      en: 'A readable guide with small embedded figures, covering the degree-of-freedom count, measurement along any axis and the P = cos²(α/2) rule.',
      tr: 'Küçük gömülü şekillerle serbestlik derecesi sayımını, her eksende ölçümü ve P = cos²(α/2) kuralını anlatan okunaklı bir rehber.',
    },
  },
  {
    id: 'rasqberry', group: 'teaching',
    authors: 'RasQberry community (Jan-R. Lahmann)', title: 'Bloch Sphere demo', venue: 'RasQberry Two documentation', year: 'n.d.',
    url: 'https://rasqberry.org/03-quantum-computing-demos/bloch-sphere/',
    note: {
      en: 'A demo guide with an honest “What it cannot show” section on the limits of the Bloch picture.',
      tr: 'Bloch resminin sınırlarını dürüstçe sıralayan “What it cannot show” bölümüyle bir demo rehberi.',
    },
  },

  // Research
  {
    id: 'hu-2024', group: 'research',
    authors: 'Peter Hu, Yangqiuting Li, Roger S. K. Mong, Chandralekha Singh', title: 'Student understanding of the Bloch sphere', venue: 'European Journal of Physics 45, 025705', year: '2024',
    url: 'https://arxiv.org/abs/2403.01047',
    note: {
      en: 'The catalogue of Bloch-sphere difficulties this site is built against: half angles, angle conventions, orthogonal states, certainty and global versus relative phase.',
      tr: 'Bu sitenin karşısına göre kurulduğu Bloch küresi güçlükleri listesi: yarım açı, açı kuralları, dik durumlar, kesin sonuç ve global/bağıl faz.',
    },
  },
  {
    id: 'wan-2019', group: 'research',
    authors: 'Tong Wan, Paul J. Emigh, Peter S. Shaffer', title: 'Probing student reasoning in relating relative phase and quantum phenomena', venue: 'Physical Review Physics Education Research 15, 020139', year: '2019',
    url: 'https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.15.020139',
    note: {
      en: 'Evidence that many students do not see that states differing only by a relative phase can be told apart in an experiment.',
      tr: 'Öğrencilerin çoğunun yalnızca bağıl fazı farklı olan durumların deneyde ayırt edilebildiğini görmediğine dair kanıt.',
    },
  },
  {
    id: 'passante-2015', group: 'research',
    authors: 'Gina Passante, Paul J. Emigh, Peter S. Shaffer', title: 'Student ability to distinguish between superposition states and mixed states in quantum mechanics', venue: 'Physical Review Special Topics – Physics Education Research 11, 020135', year: '2015',
    url: 'https://eric.ed.gov/?id=EJ1083354',
    note: {
      en: 'The study behind § 6: students across levels confuse a superposition with a “lack of knowledge” mixture.',
      tr: '§ 6’nın dayanağı olan çalışma: her düzeyden öğrenci süperpozisyonu “bilgi eksikliği” karışımıyla karıştırıyor.',
    },
  },
  {
    id: 'qerimi-2025', group: 'research',
    authors: 'Linda Qerimi, Sarah Malone, Eva Rexigel, Sascha Mehlhase, Jochen Kuhn, Stefan Küchemann', title: 'Exploring the mechanisms of qubit representations and introducing a new category system for visual representations', venue: 'EPJ Quantum Technology 12', year: '2025',
    url: 'https://arxiv.org/abs/2409.17197',
    note: {
      en: 'An expert rating of four qubit pictures, in which the Bloch sphere is judged more likely than some alternatives to cause understanding difficulties.',
      tr: 'Dört kübit gösteriminin uzmanlarca değerlendirildiği, Bloch küresinin bazı alternatiflere göre anlama güçlüğüne daha açık bulunduğu çalışma.',
    },
  },

  // Tools
  {
    id: 'phet', group: 'tools',
    authors: 'PhET Interactive Simulations, University of Colorado Boulder', title: 'Quantum Measurement', venue: 'PhET', year: 'n.d.',
    url: 'https://phet.colorado.edu/en/simulations/quantum-measurement',
    note: {
      en: 'A research-based simulation that goes from classical coins to spins to the Bloch sphere, with repeated measurements as a learning goal.',
      tr: 'Klasik paradan spine, oradan Bloch küresine giden, tekrarlı ölçümü öğrenme hedefi yapan araştırmaya dayalı bir simülasyon.',
    },
  },
  {
    id: 'quvis', group: 'tools',
    authors: 'QuVis Quantum Mechanics Visualization Project, University of St Andrews', title: 'Bloch sphere representation of quantum states for a spin ½ particle', venue: 'QuVis', year: 'n.d.',
    url: 'https://www.st-andrews.ac.uk/physics/quvis/simulations_html5/sims/blochsphere/blochsphere.html',
    note: {
      en: 'The education-research simulation with a step-by-step explanation tab; note that its text swaps the names “polar” and “azimuthal” for θ and ϕ.',
      tr: 'Adım adım açıklama sekmesi olan, eğitim araştırmasına dayalı simülasyon; metninde θ ve ϕ için “kutupsal” ve “azimut” adlarının ters yazıldığına dikkat et.',
    },
  },
  {
    id: 'qolour-tool', group: 'tools',
    authors: 'Qolour', title: 'Interactive Bloch Sphere Visualizer', venue: 'qolour.com', year: 'n.d.',
    url: 'https://www.qolour.com/bloch-sphere',
    note: {
      en: 'A compact tool with gates and measurement in Z, X or Y that shows the collapse to a pole.',
      tr: 'Kapıları ve Z, X ya da Y’de ölçümü olan, kutba çöküşü gösteren derli toplu bir araç.',
    },
  },
  {
    id: 'kherb', group: 'tools',
    authors: 'Konstantin Herb (ETH Zurich)', title: 'Blochy: Bloch sphere visualizer', venue: 'bloch.kherb.io', year: '2023',
    url: 'https://bloch.kherb.io/',
    note: {
      en: 'Rotations about any axis, pulses and a maths page with R_n(φ) = exp(−iφ n·σ/2); its explanation page uses the opposite sign for x.',
      tr: 'Herhangi bir eksen etrafında dönüşler, darbeler ve R_n(φ) = exp(−iφ n·σ/2) içeren bir matematik sayfası; açıklama sayfasında x’in işareti ters.',
    },
  },
  {
    id: 'quirk', group: 'tools',
    authors: 'Craig Gidney', title: 'Quirk', venue: 'algassert.com', year: 'n.d.',
    url: 'https://algassert.com/quirk',
    note: {
      en: 'A drag-and-drop circuit simulator for up to 16 qubits whose Bloch display shows each wire’s local state.',
      tr: '16 kübite kadar sürükle-bırak devre simülatörü; Bloch göstergesi her telin yerel durumunu gösterir.',
    },
  },
  {
    id: 'unbloched', group: 'tools',
    authors: 'gamberoillecito', title: 'unBLOCHed', venue: 'unbloched.xyz', year: 'n.d.',
    url: 'https://unbloched.xyz/',
    note: {
      en: 'An advanced simulator with density matrices, custom unitaries and noise channels, for going beyond pure states.',
      tr: 'Yoğunluk matrisleri, özel üniterler ve gürültü kanallarıyla saf durumların ötesine geçmek için gelişmiş bir simülatör.',
    },
  },
  {
    id: 'qubit-evolution', group: 'tools',
    authors: 'Kyle Gough', title: 'Qubit Evolution', venue: 'kylegough.github.io', year: 'n.d.',
    url: 'https://kylegough.github.io/qubit-evolution/',
    note: {
      en: 'Larmor and Rabi motion under an adjustable Hamiltonian, a preview of the time evolution this site will add later.',
      tr: 'Ayarlanabilir bir Hamiltonyen altında Larmor ve Rabi hareketi; bu sitenin ileride ekleyeceği zamanla değişime bir ön bakış.',
    },
  },
  {
    id: 'qiskit', group: 'tools',
    authors: 'IBM / Qiskit', title: 'plot_bloch_multivector and plot_bloch_vector', venue: 'Qiskit API documentation', year: 'n.d.',
    url: 'https://quantum.cloud.ibm.com/docs/en/api/qiskit/qiskit.visualization.plot_bloch_multivector',
    note: {
      en: 'The industry-standard convention (θ from +z, φ from +x) and a per-qubit view built from each qubit’s Pauli expectation values.',
      tr: 'Sektör standardı kural (θ +z’den, φ +x’ten) ve her kübitin Pauli beklenen değerlerinden kurulan kübit başına görünüm.',
    },
  },
  {
    id: 'qutip', group: 'tools',
    authors: 'QuTiP', title: 'Plotting on the Bloch Sphere', venue: 'QuTiP documentation', year: 'n.d.',
    url: 'https://qutip.readthedocs.io/en/latest/guide/guide-bloch.html',
    note: {
      en: 'The Python way to draw states, density matrices and trajectories on the sphere.',
      tr: 'Durumları, yoğunluk matrislerini ve yörüngeleri küre üzerine Python ile çizmenin yolu.',
    },
  },
  {
    id: 'ibm-composer', group: 'tools',
    authors: 'IBM', title: 'IBM Quantum Composer', venue: 'IBM Quantum documentation', year: 'n.d.',
    url: 'https://quantum.cloud.ibm.com/docs/en/guides/composer',
    note: {
      en: 'A circuit builder that runs on real hardware; its q-sphere is not the Bloch sphere, even for one qubit.',
      tr: 'Gerçek donanımda çalışan bir devre kurucu; q-küresi tek kübit için bile Bloch küresi değildir.',
    },
  },
];
