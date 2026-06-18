import db from "./database";
import { v4 as uuidv4 } from "uuid";

export function seedData() {
  const villageCount = db
    .prepare("SELECT COUNT(*) as count FROM ancestral_villages")
    .get() as { count: number };
  if (villageCount.count > 0) {
    console.log("已有数据，跳过种子数据初始化");
    return;
  }

  const villages = [
    {
      id: uuidv4(),
      name: "陈厝村",
      province: "福建省",
      city: "泉州市",
      district: "晋江市",
      surname: "陈",
      ancestral_hall_name: "颍川陈氏宗祠",
      description: "陈氏家族自宋代南迁至此，已有千年历史，宗祠始建于明代",
    },
    {
      id: uuidv4(),
      name: "李家庄",
      province: "福建省",
      city: "龙岩市",
      district: "永定区",
      surname: "李",
      ancestral_hall_name: "陇西李氏家庙",
      description: "李氏客家村落，土楼建筑群，族谱可追溯至唐高祖李渊",
    },
    {
      id: uuidv4(),
      name: "王岗村",
      province: "广东省",
      city: "梅州市",
      district: "兴宁市",
      surname: "王",
      ancestral_hall_name: "三槐堂王氏宗祠",
      description: "典型的客家围龙屋村落，王氏族人已在此繁衍三十余代",
    },
    {
      id: uuidv4(),
      name: "林家寨",
      province: "福建省",
      city: "漳州市",
      district: "南靖县",
      surname: "林",
      ancestral_hall_name: "九牧林氏宗祠",
      description: "林氏望族，唐代九牧刺史之后裔，书香门第",
    },
    {
      id: uuidv4(),
      name: "黄田村",
      province: "广东省",
      city: "潮州市",
      district: "饶平县",
      surname: "黄",
      ancestral_hall_name: "江夏黄氏大宗祠",
      description: "黄氏客家祖地，族人遍布海内外",
    },
  ];

  const insertVillage = db.prepare(`
    INSERT INTO ancestral_villages (id, name, province, city, district, surname, ancestral_hall_name, description)
    VALUES (@id, @name, @province, @city, @district, @surname, @ancestral_hall_name, @description)
  `);

  const villageTx = db.transaction((villageList: any[]) => {
    for (const v of villageList) insertVillage.run(v);
  });
  villageTx(villages);

  const volunteers = [
    {
      id: uuidv4(),
      name: "陈志强",
      phone: "13800138001",
      province: "福建省",
      city: "泉州市",
      district: "晋江市",
      surnames: "陈",
      skills: "族谱研究,地方史,闽南语",
      status: "active",
    },
    {
      id: uuidv4(),
      name: "李雪梅",
      phone: "13800138002",
      province: "福建省",
      city: "龙岩市",
      district: "永定区",
      surnames: "李",
      skills: "客家文化,土楼研究,族谱整理",
      status: "active",
    },
    {
      id: uuidv4(),
      name: "王建国",
      phone: "13800138003",
      province: "广东省",
      city: "梅州市",
      district: "兴宁市",
      surnames: "王",
      skills: "客家话,围龙屋建筑,宗亲联络",
      status: "active",
    },
    {
      id: uuidv4(),
      name: "林清源",
      phone: "13800138004",
      province: "福建省",
      city: "漳州市",
      district: "南靖县",
      surnames: "林",
      skills: "闽南文化,族谱,方言",
      status: "active",
    },
  ];

  const insertVolunteer = db.prepare(`
    INSERT INTO volunteers (id, name, phone, province, city, district, surnames, skills, status)
    VALUES (@id, @name, @phone, @province, @city, @district, @surnames, @skills, @status)
  `);

  const volunteerTx = db.transaction((volunteerList: any[]) => {
    for (const v of volunteers) insertVolunteer.run(v);
  });
  volunteerTx(volunteers);

  const volunteerMap: Record<string, string> = {};
  volunteers.forEach((v) => {
    volunteerMap[v.name] = v.id;
  });

  const applications = [
    {
      id: uuidv4(),
      applicant_name: "陈老先生",
      applicant_phone: "15900159001",
      surname: "陈",
      origin_province: "福建省",
      origin_city: "泉州市",
      origin_district: "晋江市",
      village_clue: "记得爷爷说老家在晋江海边，村名叫陈厝",
      ancestral_hall_clue: "宗祠叫什么堂，好像有颍川两个字",
      departure_era: "清末民初",
      generation_count: 4,
      known_ancestors: "曾祖父陈德顺，祖父陈火旺",
      family_story:
        "1910年左右，曾祖父带着家人下南洋，后来辗转到了台湾。爷爷临终前一直念叨着要回老家看看，现在我想替他完成这个心愿。",
      status: "investigating",
      volunteer_id: volunteerMap["陈志强"],
      current_step: 1,
    },
    {
      id: uuidv4(),
      applicant_name: "李小姐",
      applicant_phone: "15900159002",
      surname: "李",
      origin_province: "福建省",
      origin_city: "龙岩市",
      origin_district: "",
      village_clue: "奶奶说老家是客家土楼，姓李",
      ancestral_hall_clue: "不知道宗祠名字",
      departure_era: "1940年代",
      generation_count: 3,
      known_ancestors: "祖父李文山，听说以前是教书先生",
      family_story:
        "1949年随国民党军队来台，奶奶是福建龙岩客家人，一直想回去看看，但生前没能成行。我想找到老家，替奶奶上香。",
      status: "investigating",
      volunteer_id: volunteerMap["李雪梅"],
      current_step: 2,
    },
    {
      id: uuidv4(),
      applicant_name: "王先生",
      applicant_phone: "15900159003",
      surname: "王",
      origin_province: "广东省",
      origin_city: "梅州市",
      origin_district: "兴宁市",
      village_clue: "父亲说老家在兴宁的一个围龙屋",
      ancestral_hall_clue: "三槐堂",
      departure_era: "民国时期",
      generation_count: 3,
      known_ancestors: "祖父王大山",
      family_story:
        "父亲十几岁时离家打拼，后来定居香港，再到台湾。老家在广东兴宁，姓王，记得宗祠叫三槐堂。",
      status: "investigating",
      volunteer_id: volunteerMap["王建国"],
      current_step: 0,
    },
    {
      id: uuidv4(),
      applicant_name: "林先生",
      applicant_phone: "15900159004",
      surname: "林",
      origin_province: "福建省",
      origin_city: "漳州市",
      origin_district: "",
      village_clue: "九牧林的后代",
      ancestral_hall_clue: "",
      departure_era: "清代",
      generation_count: 5,
      known_ancestors: "",
      family_story:
        "家族口传来自福建漳州，是九牧林氏后人，具体是哪个县哪个村已经不可考了。",
      status: "pending",
      volunteer_id: null,
      current_step: 0,
    },
    {
      id: uuidv4(),
      applicant_name: "黄女士",
      applicant_phone: "15900159005",
      surname: "黄",
      origin_province: "广东省",
      origin_city: "潮州市",
      origin_district: "饶平县",
      village_clue: "黄田",
      ancestral_hall_clue: "江夏堂",
      departure_era: "1930年代",
      generation_count: 3,
      known_ancestors: "黄天赐",
      family_story:
        "外公年轻时从潮州饶平去了南洋，后来到台湾定居。他常说老家在黄田村，村口有棵大榕树。",
      status: "confirmed",
      volunteer_id: volunteerMap["陈志强"],
      current_step: 3,
    },
  ];

  const insertApp = db.prepare(`
    INSERT INTO applications (
      id, applicant_name, applicant_phone, surname, origin_province, origin_city, origin_district,
      village_clue, ancestral_hall_clue, departure_era, generation_count, known_ancestors,
      family_story, status, volunteer_id, current_step
    ) VALUES (
      @id, @applicant_name, @applicant_phone, @surname, @origin_province, @origin_city, @origin_district,
      @village_clue, @ancestral_hall_clue, @departure_era, @generation_count, @known_ancestors,
      @family_story, @status, @volunteer_id, @current_step
    )
  `);

  const appTx = db.transaction((appList: any[]) => {
    for (const a of appList) insertApp.run(a);
  });
  appTx(applications);

  const appMap: Record<string, string> = {};
  applications.forEach((a) => {
    appMap[a.applicant_name] = a.id;
  });

  const stepTemplates = ["线索梳理", "实地探访", "宗亲确认"];

  const insertStep = db.prepare(`
    INSERT INTO investigation_steps (id, application_id, step_index, step_name, status, result, notes)
    VALUES (@id, @application_id, @step_index, @step_name, @status, @result, @notes)
  `);

  const stepsData = [
    {
      appName: "陈老先生",
      steps: [
        {
          step_index: 0,
          status: "completed",
          result: "根据颍川陈氏和晋江陈厝的线索，初步锁定晋江市陈厝村。",
          notes: "查阅了《晋江县志》和陈氏族谱",
        },
        {
          step_index: 1,
          status: "in_progress",
          result: null,
          notes: "已联系村委会，正在核实族谱世系",
        },
        { step_index: 2, status: "pending", result: null, notes: null },
      ],
    },
    {
      appName: "李小姐",
      steps: [
        {
          step_index: 0,
          status: "completed",
          result: "龙岩李姓主要集中在永定、上杭一带，以客家土楼为特征。",
          notes: "已查阅龙岩客家姓氏分布图",
        },
        {
          step_index: 1,
          status: "completed",
          result:
            "永定区湖坑镇有李家庄，李氏客家土楼群，族谱记载与李文山年代吻合。",
          notes: "实地走访了永定土楼群",
        },
        {
          step_index: 2,
          status: "in_progress",
          result: null,
          notes: "正在等待李家宗亲的最终确认",
        },
      ],
    },
    {
      appName: "王先生",
      steps: [
        { step_index: 0, status: "pending", result: null, notes: null },
        { step_index: 1, status: "pending", result: null, notes: null },
        { step_index: 2, status: "pending", result: null, notes: null },
      ],
    },
  ];

  const stepTx = db.transaction(() => {
    for (const { appName, steps } of stepsData) {
      const appId = appMap[appName];
      for (const s of steps) {
        insertStep.run({
          id: uuidv4(),
          application_id: appId,
          step_index: s.step_index,
          step_name: stepTemplates[s.step_index],
          status: s.status,
          result: s.result,
          notes: s.notes,
        });
      }
    }
  });
  stepTx();

  const villageMap: Record<string, string> = {};
  villages.forEach((v) => {
    villageMap[v.name] = v.id;
  });

  const pilgrimages = [
    {
      id: uuidv4(),
      application_id: appMap["黄女士"],
      village_id: villageMap["黄田村"],
      ancestral_hall: "江夏黄氏大宗祠",
      pilgrimage_date: "2025-04-05",
      companion_name: "陈志强",
      companion_phone: "13800138001",
      status: "completed",
      memories:
        "在大榕树下站了很久，外公说的那棵榕树真的还在。宗亲们很热情，在宗祠上香的时候，眼泪忍不住流下来。",
      story:
        "黄女士带着外公的遗像回到黄田村，在江夏黄氏大宗祠举行了隆重的祭祖仪式。村里的长辈说，黄天赐这一支脉在族谱上有记载，没想到时隔近百年，后人还能找回来。",
      photos: "",
    },
  ];

  const insertPilgrimage = db.prepare(`
    INSERT INTO pilgrimages (
      id, application_id, village_id, ancestral_hall, pilgrimage_date,
      companion_name, companion_phone, status, memories, story, photos
    ) VALUES (
      @id, @application_id, @village_id, @ancestral_hall, @pilgrimage_date,
      @companion_name, @companion_phone, @status, @memories, @story, @photos
    )
  `);

  const pilgrimageTx = db.transaction((pilgrimageList: any[]) => {
    for (const p of pilgrimageList) insertPilgrimage.run(p);
  });
  pilgrimageTx(pilgrimages);

  console.log("种子数据初始化完成");
}
