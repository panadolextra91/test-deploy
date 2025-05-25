'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    
    const newsArticles = [
      // Live Healthily Category (3 articles, 1 featured)
      {
        title: '10 Simple Daily Habits for a Healthier Lifestyle',
        category: 'Live Healthily',
        content: `Living a healthy lifestyle doesn't have to be complicated. Small, consistent changes in your daily routine can lead to significant improvements in your overall well-being. Here are 10 simple habits you can incorporate into your daily life:

1. Start your day with a glass of water to kickstart your metabolism and hydrate your body after hours of sleep.

2. Take a 10-minute walk after each meal to aid digestion and boost your energy levels.

3. Practice deep breathing exercises for 5 minutes daily to reduce stress and improve mental clarity.

4. Choose whole foods over processed ones whenever possible to fuel your body with essential nutrients.

5. Get 7-8 hours of quality sleep each night to allow your body to repair and regenerate.

6. Limit screen time before bed to improve sleep quality and reduce eye strain.

7. Practice gratitude by writing down three things you're thankful for each day.

8. Stay hydrated by drinking at least 8 glasses of water throughout the day.

9. Include physical activity in your routine, even if it's just stretching or light exercises.

10. Connect with friends and family regularly to maintain strong social relationships.

Remember, the key to lasting change is consistency. Start with one or two habits and gradually add more as they become part of your routine.`,
        summary: 'Discover 10 simple daily habits that can transform your health and well-being without overwhelming your schedule.',
        is_feature: true,
        created_at: now,
        updated_at: now
      },
      {
        title: 'The Science Behind Stress and How to Manage It',
        category: 'Live Healthily',
        content: `Stress is a natural response to challenging situations, but chronic stress can have serious impacts on both physical and mental health. Understanding the science behind stress can help you develop better coping strategies.

When you encounter a stressful situation, your body releases hormones like cortisol and adrenaline. These hormones prepare your body for "fight or flight" by increasing heart rate, blood pressure, and energy supplies. While this response is helpful in acute situations, prolonged activation can lead to health problems.

Chronic stress has been linked to:
- Cardiovascular disease
- Weakened immune system
- Digestive issues
- Mental health disorders
- Sleep disturbances

Effective stress management techniques include:
- Regular exercise
- Meditation and mindfulness practices
- Adequate sleep
- Social support
- Time management
- Professional counseling when needed

By implementing these strategies, you can reduce the negative impact of stress on your health and improve your quality of life.`,
        summary: 'Learn about the physiological effects of stress and evidence-based strategies for managing it effectively.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Building Strong Immunity Through Nutrition',
        category: 'Live Healthily',
        content: `Your immune system is your body's defense against infections and diseases. While genetics play a role in immune function, nutrition significantly impacts how well your immune system works.

Key nutrients for immune health include:

Vitamin C: Found in citrus fruits, berries, and leafy greens. It supports white blood cell function and acts as an antioxidant.

Vitamin D: Essential for immune regulation. Sources include sunlight exposure, fatty fish, and fortified foods.

Zinc: Important for immune cell development. Found in meat, seafood, nuts, and seeds.

Probiotics: Support gut health, which is closely linked to immune function. Found in yogurt, kefir, and fermented foods.

Antioxidants: Protect cells from damage. Found in colorful fruits and vegetables.

To boost your immunity through nutrition:
- Eat a variety of colorful fruits and vegetables
- Include lean proteins in your diet
- Choose whole grains over refined ones
- Stay hydrated
- Limit processed foods and added sugars
- Consider supplements if you have deficiencies

Remember, a balanced diet combined with regular exercise, adequate sleep, and stress management provides the best foundation for a strong immune system.`,
        summary: 'Discover how proper nutrition can strengthen your immune system and protect against illness.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },

      // Moms and Babies Category (3 articles, 1 featured)
      {
        title: 'Essential Prenatal Care: A Complete Guide for Expecting Mothers',
        category: 'Moms and Babies',
        content: `Prenatal care is crucial for the health of both mother and baby during pregnancy. Regular check-ups and proper care can prevent complications and ensure a healthy pregnancy.

Key components of prenatal care include:

Regular Medical Check-ups:
- First trimester: Monthly visits
- Second trimester: Every 2-3 weeks
- Third trimester: Weekly visits

Important Tests and Screenings:
- Blood tests to check for anemia, infections, and genetic conditions
- Ultrasounds to monitor baby's development
- Blood pressure and weight monitoring
- Urine tests to check for protein and glucose

Nutrition During Pregnancy:
- Take prenatal vitamins with folic acid
- Eat a balanced diet rich in fruits, vegetables, and lean proteins
- Avoid alcohol, smoking, and certain medications
- Stay hydrated and limit caffeine intake

Physical Activity:
- Engage in moderate exercise as approved by your doctor
- Avoid high-risk activities
- Practice prenatal yoga or swimming

Warning Signs to Watch For:
- Severe nausea and vomiting
- Bleeding or cramping
- Severe headaches
- Vision changes
- Decreased fetal movement

Remember, every pregnancy is unique. Always consult with your healthcare provider for personalized advice and care.`,
        summary: 'A comprehensive guide to prenatal care covering medical check-ups, nutrition, exercise, and warning signs during pregnancy.',
        is_feature: true,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Breastfeeding Benefits and Common Challenges',
        category: 'Moms and Babies',
        content: `Breastfeeding provides numerous benefits for both mother and baby, but it can also present challenges. Understanding what to expect can help you prepare for a successful breastfeeding journey.

Benefits for Baby:
- Perfect nutrition tailored to baby's needs
- Antibodies that boost immune system
- Reduced risk of infections and allergies
- Better cognitive development
- Lower risk of SIDS

Benefits for Mother:
- Faster postpartum recovery
- Reduced risk of breast and ovarian cancer
- Natural birth control (though not 100% reliable)
- Emotional bonding with baby
- Cost savings

Common Challenges and Solutions:

Sore Nipples:
- Ensure proper latch
- Use lanolin cream
- Air dry nipples after feeding

Low Milk Supply:
- Feed frequently
- Stay hydrated and well-nourished
- Get adequate rest
- Consider pumping between feeds

Engorgement:
- Feed frequently
- Use warm compresses before feeding
- Apply cold compresses after feeding

Remember, breastfeeding is a learned skill for both mother and baby. Don't hesitate to seek help from lactation consultants, your healthcare provider, or support groups.`,
        summary: 'Learn about the benefits of breastfeeding and practical solutions to common challenges new mothers face.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Baby Sleep Patterns: What to Expect in the First Year',
        category: 'Moms and Babies',
        content: `Understanding baby sleep patterns can help new parents set realistic expectations and develop healthy sleep habits for their little ones.

Newborn (0-3 months):
- Sleep 14-17 hours per day
- Sleep in 2-4 hour stretches
- No established day/night rhythm
- Frequent night wakings for feeding

3-6 Months:
- Sleep 12-15 hours per day
- Longer sleep stretches at night
- 3-4 naps during the day
- May start sleeping through the night

6-12 Months:
- Sleep 12-14 hours per day
- Most babies sleep through the night
- 2-3 naps during the day
- More predictable sleep schedule

Tips for Better Baby Sleep:

Create a Sleep-Friendly Environment:
- Keep the room dark and quiet
- Maintain comfortable temperature
- Use a firm mattress with fitted sheet only

Establish a Bedtime Routine:
- Consistent bedtime
- Calming activities like bath or story
- Put baby down awake but drowsy

Safe Sleep Practices:
- Always place baby on their back
- Keep crib free of blankets, pillows, and toys
- Use a sleep sack instead of loose bedding

Remember, every baby is different. Some may sleep through the night early, while others take longer to establish regular patterns. Be patient and consistent with your approach.`,
        summary: 'A guide to understanding baby sleep patterns and establishing healthy sleep habits during the first year.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },

      // Nutrition Category (3 articles, 1 featured)
      {
        title: 'The Complete Guide to Balanced Nutrition for Optimal Health',
        category: 'Nutrition',
        content: `Proper nutrition is the foundation of good health. Understanding the basics of balanced nutrition can help you make informed food choices and maintain optimal health throughout your life.

The Five Food Groups:

1. Fruits and Vegetables:
- Aim for 5-9 servings per day
- Choose a variety of colors
- Include both fresh and frozen options
- Rich in vitamins, minerals, and fiber

2. Whole Grains:
- Choose whole grains over refined grains
- Include brown rice, quinoa, oats, and whole wheat
- Provide sustained energy and fiber

3. Lean Proteins:
- Include fish, poultry, beans, nuts, and seeds
- Aim for 2-3 servings per day
- Essential for muscle maintenance and repair

4. Dairy or Alternatives:
- Choose low-fat options
- Include calcium-fortified plant-based alternatives
- Important for bone health

5. Healthy Fats:
- Include olive oil, avocados, nuts, and fatty fish
- Limit saturated and trans fats
- Essential for brain health and nutrient absorption

Portion Control Tips:
- Use smaller plates and bowls
- Fill half your plate with vegetables
- Listen to hunger and fullness cues
- Eat slowly and mindfully

Hydration:
- Drink 8-10 glasses of water daily
- Limit sugary drinks
- Include herbal teas and water-rich foods

Meal Planning:
- Plan meals and snacks in advance
- Prepare healthy options ahead of time
- Keep nutritious snacks available

Remember, small changes in your eating habits can lead to significant improvements in your health over time.`,
        summary: 'Master the fundamentals of balanced nutrition with this comprehensive guide to healthy eating and meal planning.',
        is_feature: true,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Superfoods: Separating Fact from Fiction',
        category: 'Nutrition',
        content: `The term "superfood" has become increasingly popular in recent years, but what does it really mean? Let's explore the science behind these nutrient-dense foods and separate marketing hype from nutritional facts.

What Are Superfoods?
Superfoods are nutrient-rich foods that are especially beneficial for health and well-being. While there's no official scientific definition, these foods typically contain high levels of vitamins, minerals, antioxidants, and other beneficial compounds.

Evidence-Based Superfoods:

Blueberries:
- High in antioxidants and vitamin C
- May improve brain function and memory
- Support heart health

Salmon:
- Rich in omega-3 fatty acids
- Supports brain and heart health
- High-quality protein source

Leafy Greens:
- Packed with vitamins A, C, and K
- High in folate and iron
- May reduce risk of chronic diseases

Greek Yogurt:
- High in protein and probiotics
- Supports digestive health
- Good source of calcium

Nuts and Seeds:
- Healthy fats and protein
- May reduce inflammation
- Support heart health

The Reality Check:
- No single food can provide all nutrients
- A varied diet is more important than individual superfoods
- Many "ordinary" foods are equally nutritious
- Marketing often exaggerates benefits

The key to good nutrition isn't finding the perfect superfood, but rather eating a variety of whole, minimally processed foods as part of a balanced diet.`,
        summary: 'Discover the truth about superfoods and learn which nutrient-dense foods deserve a place in your diet.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Understanding Food Labels: A Consumer\'s Guide',
        category: 'Nutrition',
        content: `Reading food labels is an essential skill for making healthy food choices. Understanding what information to look for and how to interpret it can help you select nutritious options and avoid misleading marketing claims.

Key Components of Food Labels:

Serving Size:
- All nutrition information is based on this amount
- Compare to how much you actually eat
- Multiple servings mean multiplying all values

Calories:
- Energy provided per serving
- Consider your daily calorie needs
- Look at calories from fat

Nutrients to Limit:
- Saturated fat: Less than 10% of daily calories
- Trans fat: Avoid completely
- Sodium: Less than 2,300mg per day
- Added sugars: Less than 10% of daily calories

Nutrients to Increase:
- Fiber: Aim for 25-35g per day
- Protein: Varies by individual needs
- Vitamins and minerals: Aim for 100% Daily Value

Ingredient List:
- Listed in order of weight (most to least)
- Look for whole foods as first ingredients
- Avoid long lists of unrecognizable ingredients

Marketing Claims to Watch:
- "Natural" doesn't mean healthy
- "Low-fat" may be high in sugar
- "Organic" doesn't guarantee nutritional superiority
- "Gluten-free" isn't automatically healthier

Quick Tips:
- Compare similar products
- Focus on whole foods when possible
- Don't be fooled by front-of-package claims
- Use the 5% and 20% rule: 5% or less is low, 20% or more is high

Learning to read labels empowers you to make informed choices and take control of your nutrition.`,
        summary: 'Learn how to decode food labels and make informed choices about the foods you buy and eat.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },

      // Sex Education Category (3 articles, 1 featured)
      {
        title: 'Comprehensive Sexual Health: What Everyone Should Know',
        category: 'Sex Education',
        content: `Sexual health is an important aspect of overall well-being that encompasses physical, emotional, mental, and social aspects of sexuality. Understanding sexual health helps individuals make informed decisions and maintain healthy relationships.

Key Components of Sexual Health:

Physical Health:
- Regular STI testing and prevention
- Understanding reproductive anatomy
- Practicing safe sex
- Recognizing signs of sexual health problems

Emotional Well-being:
- Healthy communication about sexuality
- Understanding consent and boundaries
- Addressing sexual concerns or anxieties
- Building self-esteem and body positivity

Reproductive Health:
- Understanding fertility and contraception
- Family planning decisions
- Pregnancy prevention or planning
- Menstrual health management

Safe Sex Practices:
- Consistent and correct condom use
- Regular STI testing for sexually active individuals
- Open communication with partners about sexual history
- Understanding that abstinence is the only 100% effective prevention

Common Sexual Health Concerns:
- STIs and their prevention/treatment
- Sexual dysfunction
- Fertility issues
- Menstrual irregularities

When to Seek Help:
- Unusual symptoms or discharge
- Pain during sexual activity
- Concerns about fertility
- Relationship or communication issues

Remember, sexual health is a normal part of human health. Don't hesitate to discuss concerns with healthcare providers who can provide confidential, non-judgmental care and accurate information.`,
        summary: 'A comprehensive overview of sexual health covering physical, emotional, and reproductive aspects of sexuality.',
        is_feature: true,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Understanding Contraception: Options and Effectiveness',
        category: 'Sex Education',
        content: `Contraception allows individuals to plan if and when to have children. Understanding the various options available can help you make informed decisions about birth control that fits your lifestyle and health needs.

Hormonal Methods:

Birth Control Pills:
- 91% effective with typical use
- Must be taken daily at the same time
- May regulate periods and reduce acne

IUDs (Intrauterine Devices):
- Over 99% effective
- Long-lasting (3-10 years depending on type)
- Hormonal and non-hormonal options available

Implants:
- Over 99% effective
- Lasts up to 3 years
- Small rod inserted in upper arm

Barrier Methods:

Condoms:
- 85% effective with typical use
- Only method that prevents STIs
- Available for both males and females

Diaphragms and Cervical Caps:
- 88% effective with typical use
- Must be used with spermicide
- Requires fitting by healthcare provider

Natural Methods:

Fertility Awareness:
- 76% effective with typical use
- Requires tracking menstrual cycles
- No side effects but requires dedication

Withdrawal:
- 78% effective with typical use
- Requires significant self-control
- Does not protect against STIs

Emergency Contraception:
- Available over-the-counter
- Most effective within 72 hours
- Not intended for regular use

Factors to Consider:
- Effectiveness rates
- Side effects and health considerations
- Cost and accessibility
- STI protection needs
- Future pregnancy plans

Consult with a healthcare provider to discuss which method might be best for your individual situation and health needs.`,
        summary: 'Explore different contraceptive methods, their effectiveness rates, and factors to consider when choosing birth control.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Healthy Relationships and Communication',
        category: 'Sex Education',
        content: `Healthy relationships are built on mutual respect, trust, and open communication. Understanding the foundations of healthy relationships can improve your connections with others and contribute to your overall well-being.

Key Elements of Healthy Relationships:

Communication:
- Express feelings and needs clearly
- Listen actively to your partner
- Discuss problems openly and respectfully
- Ask questions and seek to understand

Trust:
- Be honest and reliable
- Keep promises and commitments
- Respect privacy and boundaries
- Build trust through consistent actions

Respect:
- Value each other's opinions and feelings
- Support individual goals and interests
- Treat each other with kindness
- Accept differences without trying to change each other

Boundaries:
- Understand and communicate your limits
- Respect your partner's boundaries
- Recognize that boundaries can change
- Never pressure someone to cross their boundaries

Consent:
- Must be freely given, ongoing, and can be withdrawn
- Cannot be given under influence of drugs or alcohol
- Silence or lack of resistance is not consent
- Both partners have the right to say no at any time

Warning Signs of Unhealthy Relationships:
- Controlling behavior
- Jealousy and possessiveness
- Verbal, emotional, or physical abuse
- Isolation from friends and family
- Pressure to engage in unwanted activities

Building Healthy Relationships:
- Maintain your individual identity
- Spend quality time together
- Show appreciation and gratitude
- Work through conflicts constructively
- Seek help when needed

Remember, healthy relationships require effort from both partners and contribute significantly to mental and emotional well-being.`,
        summary: 'Learn the essential elements of healthy relationships including communication, trust, respect, and boundaries.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },

      // Beauty Category (3 articles, 1 featured)
      {
        title: 'The Science of Skincare: Building an Effective Routine',
        category: 'Beauty',
        content: `Understanding your skin and the science behind skincare can help you build an effective routine that promotes healthy, glowing skin. Let's explore the fundamentals of skincare and how to create a routine that works for you.

Understanding Your Skin Type:

Normal Skin:
- Balanced oil production
- Few imperfections
- Small pores
- Good circulation

Dry Skin:
- Tight, rough, or flaky texture
- Less elastic
- More visible lines
- May be itchy or irritated

Oily Skin:
- Shiny appearance
- Enlarged pores
- Prone to blackheads and blemishes
- Thick, coarse texture

Combination Skin:
- Oily T-zone (forehead, nose, chin)
- Normal to dry cheeks
- Enlarged pores in T-zone

Sensitive Skin:
- Easily irritated
- Prone to redness and burning
- May react to products or environmental factors

Basic Skincare Routine:

Morning:
1. Gentle cleanser
2. Toner (optional)
3. Serum (vitamin C, hyaluronic acid)
4. Moisturizer
5. Sunscreen (SPF 30 or higher)

Evening:
1. Makeup remover/cleansing oil
2. Gentle cleanser
3. Toner (optional)
4. Treatment products (retinoids, acids)
5. Moisturizer

Key Ingredients:

Cleansing:
- Gentle surfactants
- Avoid harsh sulfates
- pH-balanced formulas

Hydration:
- Hyaluronic acid
- Glycerin
- Ceramides

Anti-aging:
- Retinoids
- Vitamin C
- Peptides

Exfoliation:
- AHA (glycolic, lactic acid)
- BHA (salicylic acid)
- Use 2-3 times per week

Sun Protection:
- Broad-spectrum SPF
- Reapply every 2 hours
- Essential for preventing premature aging

Tips for Success:
- Introduce new products gradually
- Patch test before full use
- Be consistent with your routine
- Give products time to work (4-6 weeks)
- Consult a dermatologist for persistent issues

Remember, healthy skin is more important than perfect skin. Focus on maintaining your skin's barrier function and protecting it from environmental damage.`,
        summary: 'Master the science of skincare with this comprehensive guide to understanding your skin type and building an effective routine.',
        is_feature: true,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Natural Beauty: DIY Skincare and Makeup Tips',
        category: 'Beauty',
        content: `Natural beauty approaches focus on enhancing your natural features while using gentle, often homemade products. These methods can be cost-effective and reduce exposure to harsh chemicals.

DIY Skincare Recipes:

Honey Oat Cleanser:
- 2 tbsp ground oats
- 1 tbsp honey
- Mix and gently massage on damp skin
- Rinse with warm water

Avocado Face Mask:
- 1/2 ripe avocado
- 1 tbsp honey
- 1 tsp lemon juice
- Mash together, apply for 15 minutes

Green Tea Toner:
- Brew strong green tea
- Let cool completely
- Apply with cotton pad
- Store in refrigerator for up to one week

Sugar Lip Scrub:
- 1 tsp sugar
- 1 tsp honey
- 1/2 tsp olive oil
- Gently scrub lips, rinse off

Natural Makeup Tips:

Enhance Natural Features:
- Use tinted moisturizer instead of heavy foundation
- Cream blush for a natural flush
- Clear or tinted lip balm
- Mascara to define lashes

Multi-Purpose Products:
- Lip tint that doubles as blush
- Coconut oil as makeup remover
- Aloe vera gel as primer
- Beetroot juice as natural lip stain

Healthy Hair Tips:
- Apple cider vinegar rinse for shine
- Coconut oil hair mask
- Avoid heat styling when possible
- Use silk pillowcases to reduce friction

Safety Considerations:
- Patch test all DIY products
- Use fresh ingredients
- Store properly and use within recommended timeframes
- Be aware of allergies
- Some natural ingredients can cause photosensitivity

Benefits of Natural Beauty:
- Cost-effective
- Fewer harsh chemicals
- Customizable to your needs
- Environmentally friendly
- Often gentler on sensitive skin

Remember, natural doesn't always mean better or safer. Research ingredients and listen to your skin's needs.`,
        summary: 'Discover natural beauty approaches with DIY skincare recipes and tips for enhancing your natural features.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Anti-Aging Skincare: Prevention and Treatment',
        category: 'Beauty',
        content: `Aging is a natural process, but understanding how to care for your skin can help maintain its health and appearance as you age. The key is starting prevention early and using evidence-based treatments.

Understanding Skin Aging:

Intrinsic Aging:
- Natural aging process
- Genetic factors
- Gradual loss of collagen and elastin
- Slower cell turnover

Extrinsic Aging:
- Environmental factors
- Sun exposure (photoaging)
- Pollution and toxins
- Lifestyle choices (smoking, diet)

Signs of Aging:
- Fine lines and wrinkles
- Loss of firmness and elasticity
- Uneven skin tone
- Age spots and hyperpigmentation
- Dryness and thinning skin

Prevention Strategies:

Sun Protection:
- Daily SPF 30 or higher
- Seek shade during peak hours
- Wear protective clothing and hats
- Reapply sunscreen regularly

Healthy Lifestyle:
- Balanced diet rich in antioxidants
- Stay hydrated
- Don't smoke
- Limit alcohol consumption
- Get adequate sleep
- Manage stress

Skincare Routine:
- Gentle cleansing
- Regular moisturizing
- Use antioxidants (vitamin C)
- Incorporate retinoids
- Exfoliate regularly

Treatment Options:

Topical Treatments:
- Retinoids (prescription and over-the-counter)
- Alpha hydroxy acids (AHAs)
- Beta hydroxy acids (BHAs)
- Peptides
- Growth factors

Professional Treatments:
- Chemical peels
- Microdermabrasion
- Laser treatments
- Botox and fillers
- Microneedling

At-Home Devices:
- LED light therapy
- Microcurrent devices
- Derma rollers
- Ultrasonic cleansers

Age-Specific Tips:

20s: Focus on prevention and establishing good habits
30s: Add antioxidants and gentle anti-aging ingredients
40s: Incorporate retinoids and consider professional treatments
50s+: Focus on hydration and more intensive treatments

Remember, consistency is key in anti-aging skincare. Start with gentle products and gradually introduce more active ingredients. Consult with a dermatologist for personalized advice.`,
        summary: 'Learn evidence-based strategies for preventing and treating signs of aging with proper skincare and lifestyle choices.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },

      // Hospitals Category (3 articles, 1 featured)
      {
        title: 'Navigating Healthcare: A Patient\'s Guide to Hospital Services',
        category: 'Hospitals',
        content: `Understanding hospital services and how to navigate the healthcare system can help you receive better care and make informed decisions about your health. This guide covers essential information every patient should know.

Types of Hospital Services:

Emergency Department:
- 24/7 care for urgent medical conditions
- Triage system prioritizes patients by severity
- Bring insurance cards and medication lists
- Expect wait times for non-urgent conditions

Inpatient Services:
- Overnight stays for treatment or observation
- Coordinated care from multiple specialists
- Discharge planning begins on admission
- Patient rights and responsibilities

Outpatient Services:
- Same-day procedures and treatments
- Diagnostic testing and imaging
- Specialist consultations
- Follow-up care

Specialized Departments:
- Cardiology, oncology, orthopedics
- Maternity and pediatric services
- Mental health and addiction services
- Rehabilitation and physical therapy

Preparing for Hospital Visits:

Before You Go:
- Gather insurance information
- List current medications and dosages
- Prepare questions for your healthcare team
- Arrange transportation and childcare

What to Bring:
- Photo identification
- Insurance cards
- Medication list
- Comfort items for longer stays
- Phone charger and important contacts

Understanding Your Rights:

Patient Rights:
- Right to informed consent
- Right to privacy and confidentiality
- Right to participate in care decisions
- Right to access medical records
- Right to respectful treatment

Communication Tips:
- Ask questions if you don't understand
- Request interpreters if needed
- Take notes or bring someone to help
- Speak up about concerns or preferences

Financial Considerations:
- Understand your insurance coverage
- Ask about costs upfront
- Inquire about payment plans
- Know your appeal rights

Quality and Safety:
- Hospitals are accredited by organizations like Joint Commission
- Look for quality ratings and patient satisfaction scores
- Report safety concerns to staff
- Participate in safety measures (hand hygiene, fall prevention)

Discharge Planning:
- Understand follow-up care instructions
- Know when to call your doctor
- Arrange for medications and equipment
- Confirm follow-up appointments

Being an informed patient helps ensure you receive the best possible care and have positive healthcare experiences.`,
        summary: 'A comprehensive guide to understanding hospital services, patient rights, and how to navigate the healthcare system effectively.',
        is_feature: true,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Emergency Room Etiquette: When to Go and What to Expect',
        category: 'Hospitals',
        content: `Knowing when to visit the emergency room and what to expect can help you make appropriate healthcare decisions and navigate emergency situations more effectively.

When to Go to the Emergency Room:

Life-Threatening Emergencies:
- Chest pain or heart attack symptoms
- Difficulty breathing or shortness of breath
- Severe bleeding that won't stop
- Signs of stroke (face drooping, arm weakness, speech difficulty)
- Loss of consciousness
- Severe allergic reactions
- Major trauma or injuries

Serious Conditions:
- High fever with severe symptoms
- Severe abdominal pain
- Head injuries with confusion
- Broken bones with deformity
- Severe burns
- Poisoning or overdose

When NOT to Go to the ER:

Minor Conditions Better Treated Elsewhere:
- Common cold or flu symptoms
- Minor cuts and scrapes
- Mild headaches
- Routine prescription refills
- Non-urgent rashes
- Minor sprains without deformity

Alternative Options:
- Urgent care centers for non-life-threatening issues
- Primary care physician for routine problems
- Telehealth for minor concerns
- Pharmacy clinics for basic health services

What to Expect in the ER:

Triage Process:
- Nurse assesses severity of condition
- Patients seen based on medical priority, not arrival time
- Vital signs and brief medical history taken
- Wait times vary based on severity and volume

Registration:
- Provide identification and insurance information
- Complete medical history forms
- Consent for treatment
- Financial responsibility acknowledgment

Treatment Process:
- Medical screening examination
- Diagnostic tests if needed (blood work, imaging)
- Treatment by emergency physician
- Specialist consultation if required
- Discharge or admission decision

Tips for ER Visits:

Come Prepared:
- Bring identification and insurance cards
- List of current medications
- Emergency contact information
- Comfort items for potential long waits

Communicate Effectively:
- Describe symptoms clearly and honestly
- Mention all medications and allergies
- Ask questions about your care
- Inform staff of changes in condition

Be Patient:
- Understand that sicker patients are seen first
- Bring entertainment for potential waits
- Stay hydrated and comfortable
- Follow up with primary care as recommended

Understanding ER costs and having appropriate expectations can help you make informed decisions about when to seek emergency care.`,
        summary: 'Learn when to visit the emergency room, what to expect during your visit, and how to navigate emergency healthcare effectively.',
        is_feature: false,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Choosing the Right Hospital: Quality Indicators and Research Tips',
        category: 'Hospitals',
        content: `Selecting the right hospital for your healthcare needs is an important decision that can impact your treatment outcomes and experience. Understanding quality indicators and research methods can help you make informed choices.

Quality Indicators to Consider:

Accreditation and Certifications:
- Joint Commission accreditation
- Magnet designation for nursing excellence
- Specialty certifications (stroke center, trauma center)
- State licensing and compliance

Safety Ratings:
- Hospital-acquired infection rates
- Patient safety indicators
- Medication error rates
- Fall prevention measures
- Hand hygiene compliance

Clinical Outcomes:
- Mortality rates for specific conditions
- Readmission rates
- Complication rates
- Length of stay statistics
- Success rates for procedures

Patient Experience:
- HCAHPS (Hospital Consumer Assessment) scores
- Communication with doctors and nurses
- Pain management effectiveness
- Discharge information quality
- Overall hospital rating

Research Resources:

Government Websites:
- Medicare.gov Hospital Compare
- Agency for Healthcare Research and Quality
- State health department websites
- CDC healthcare-associated infection data

Independent Rating Organizations:
- Leapfrog Group hospital ratings
- U.S. News & World Report rankings
- Consumer Reports hospital ratings
- Healthgrades quality scores

Factors to Consider:

Location and Accessibility:
- Distance from home
- Transportation options
- Parking availability
- Public transit access

Services and Specialties:
- Availability of needed services
- Specialist expertise
- Advanced technology and equipment
- Research and clinical trials

Insurance and Financial:
- Network participation
- Coverage levels
- Out-of-pocket costs
- Financial assistance programs

Personal Preferences:
- Hospital size and environment
- Religious or cultural considerations
- Language services
- Visitor policies

Questions to Ask:

About Quality:
- What are your infection rates?
- How do you measure patient satisfaction?
- What safety protocols do you have?
- Are you accredited by relevant organizations?

About Services:
- Do you have the specialists I need?
- What technology and equipment is available?
- Do you participate in clinical trials?
- What support services do you offer?

About Costs:
- What will my insurance cover?
- What are the estimated out-of-pocket costs?
- Do you offer payment plans?
- Is financial assistance available?

Making Your Decision:
- Compare multiple hospitals
- Consider both quality and convenience
- Discuss options with your doctor
- Trust your instincts about comfort level

Remember, the "best" hospital is the one that meets your specific needs and provides quality care in an environment where you feel comfortable and confident.`,
        summary: 'Learn how to research and choose the right hospital by understanding quality indicators, safety ratings, and important factors to consider.',
        is_feature: false,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('news', newsArticles, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('news', null, {});
  }
};
