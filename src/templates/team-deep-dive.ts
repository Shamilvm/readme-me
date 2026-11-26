// Built-in template: the original 85-question "get to know you" form.
import type { FormDoc } from "@/lib/form";

export const teamDeepDive: FormDoc = {
  "version": 1,
  "welcome": {
    "title": "A Little About You 🌱",
    "paragraphs": [
      "Hey! I want to know you a little better — not just as a developer, but as a person.",
      "Everyone has different dreams, interests, fears, strengths, expectations and ways of thinking. Some people know exactly what they want to become. Some are still figuring things out. Some are confident, while others have great potential but haven't discovered it yet.",
      "There's no right or wrong answer here. You don't have to impress me, give perfect answers or pretend to be someone you're not."
    ],
    "wantToUnderstand": [
      "What you dream about",
      "What motivates you",
      "What you're curious about",
      "What you enjoy and what you don't",
      "What you're good at and where you struggle",
      "What you expect from this journey",
      "How I can help you grow"
    ],
    "beforeYouStart": [
      "Be honest. Even if your answers sound unusual.",
      "Don't worry about grammar or writing perfect English.",
      "Write casually, just like you're talking to a friend.",
      "If you don't know an answer, that's completely fine.",
      "You can skip anything you're not comfortable sharing."
    ],
    "privacy": "Your answers are only for me. I'm not looking for reasons to judge anyone. I want to understand you better so we can build an environment where everyone can learn, experiment, contribute and grow. Take your time. There's no rush! Your answers save automatically, so you can stop and come back anytime."
  },
  "finale": {
    "title": "That's it! ❤️",
    "paragraphs": [
      "Thank you for taking the time to answer these questions.",
      "Don't worry about having everything figured out. We're all learning, experimenting and discovering what we're capable of.",
      "The idea is not to find perfect people. It's to understand each other, build something meaningful and help each other become better."
    ]
  },
  "sections": [
    {
      "id": "about",
      "heading": "About",
      "title": "Let's start with you",
      "intro": "Not your resume — just you as a person.",
      "commit": "add: about me",
      "doodle": "mug",
      "bitLine": "Ooh, getting personal. I like it 😄",
      "questions": [
        {
          "id": "about_self",
          "type": "longtext",
          "prompt": "Tell me a little about yourself. Not your resume — just you as a person."
        },
        {
          "id": "typical_day",
          "type": "longtext",
          "prompt": "What does your typical day look like? How do you spend your time?"
        },
        {
          "id": "three_enjoy",
          "type": "fields",
          "prompt": "What are three things you genuinely enjoy doing?",
          "fields": [
            {
              "key": "1",
              "label": "1",
              "placeholder": "Something you love doing"
            },
            {
              "key": "2",
              "label": "2",
              "placeholder": "Another one"
            },
            {
              "key": "3",
              "label": "3",
              "placeholder": "And one more"
            }
          ],
          "card": "enjoy"
        },
        {
          "id": "unknown_fact",
          "type": "longtext",
          "prompt": "What is something about you that most people don't know?"
        },
        {
          "id": "three_words",
          "type": "fields",
          "prompt": "If your friends had to describe you in three words, what would they probably say?",
          "fields": [
            {
              "key": "1",
              "label": "1",
              "placeholder": "Word one"
            },
            {
              "key": "2",
              "label": "2",
              "placeholder": "Word two"
            },
            {
              "key": "3",
              "label": "3",
              "placeholder": "Word three"
            }
          ],
          "card": "words"
        },
        {
          "id": "planner",
          "type": "single",
          "prompt": "Are you someone who plans everything, goes with the flow, or a little bit of both?",
          "options": [
            {
              "id": "i_plan_everything",
              "label": "I plan everything"
            },
            {
              "id": "i_go_with_the_flow",
              "label": "I go with the flow"
            },
            {
              "id": "a_little_bit_of_both",
              "label": "A little bit of both"
            }
          ]
        }
      ]
    },
    {
      "id": "dreams",
      "heading": "Dreams",
      "title": "Dreams, ambitions & your future",
      "intro": "Think big. Nothing here has to be realistic or related to tech.",
      "commit": "feat: add dreams and ambitions",
      "doodle": "rocket",
      "bitLine": "Dream big. Bigger. Okay, perfect ✨",
      "questions": [
        {
          "id": "five_years",
          "type": "longtext",
          "prompt": "Imagine yourself five years from now. What does your life look like?"
        },
        {
          "id": "biggest_dream",
          "type": "longtext",
          "prompt": "What is your biggest dream right now?",
          "hint": "It doesn't have to be related to technology or your career.",
          "card": "dream"
        },
        {
          "id": "become_person",
          "type": "longtext",
          "prompt": "What kind of person do you want to become?"
        },
        {
          "id": "matters_most",
          "type": "multi",
          "prompt": "What matters more to you at this stage of life?",
          "hint": "Pick as many as feel true.",
          "options": [
            {
              "id": "becoming_really_good_at_somethin",
              "label": "Becoming really good at something"
            },
            {
              "id": "earning_money_and_becoming_finan",
              "label": "Earning money and becoming financially independent"
            },
            {
              "id": "building_something_of_my_own",
              "label": "Building something of my own"
            },
            {
              "id": "getting_a_good_job_and_having_st",
              "label": "Getting a good job and having stability"
            },
            {
              "id": "exploring_different_opportunitie",
              "label": "Exploring different opportunities"
            },
            {
              "id": "making_an_impact_on_people_or_so",
              "label": "Making an impact on people or society"
            },
            {
              "id": "something_else",
              "label": "Something else",
              "other": true
            }
          ]
        },
        {
          "id": "career_goal",
          "type": "longtext",
          "prompt": "Do you have a specific career goal, or are you still exploring?"
        },
        {
          "id": "success",
          "type": "longtext",
          "prompt": "What would make you feel that you're successful in life?"
        },
        {
          "id": "inspiration",
          "type": "longtext",
          "prompt": "Is there anyone whose journey inspires you? What do you like about them?"
        }
      ]
    },
    {
      "id": "tech",
      "heading": "Tech",
      "title": "Your relationship with technology & development",
      "intro": "How you got here, and where you'd love to go.",
      "commit": "feat: add tech interests",
      "doodle": "laptop",
      "bitLine": "Finally, my favourite topic 🤓",
      "questions": [
        {
          "id": "why_dev",
          "type": "longtext",
          "prompt": "What made you interested in software development in the first place?"
        },
        {
          "id": "excite_areas",
          "type": "longtext",
          "prompt": "Which areas of development excite you the most? Why?"
        },
        {
          "id": "explored_areas",
          "type": "multi",
          "prompt": "Which areas have you already explored?",
          "options": [
            {
              "id": "frontend_development",
              "label": "Frontend development"
            },
            {
              "id": "backend_development",
              "label": "Backend development"
            },
            {
              "id": "mobile_development",
              "label": "Mobile development"
            },
            {
              "id": "ui_ux_design",
              "label": "UI/UX design"
            },
            {
              "id": "ai_machine_learning",
              "label": "AI / Machine Learning"
            },
            {
              "id": "data_science",
              "label": "Data science"
            },
            {
              "id": "devops_cloud",
              "label": "DevOps / Cloud"
            },
            {
              "id": "cybersecurity",
              "label": "Cybersecurity"
            },
            {
              "id": "game_development",
              "label": "Game development"
            },
            {
              "id": "open_source",
              "label": "Open source"
            },
            {
              "id": "other",
              "label": "Other",
              "other": true
            }
          ]
        },
        {
          "id": "love_explore",
          "type": "longtext",
          "prompt": "Which areas would you love to explore, even if you know nothing about them yet?"
        },
        {
          "id": "dont_enjoy",
          "type": "longtext",
          "prompt": "Are there any areas you genuinely don't enjoy or don't want to explore? Why?"
        },
        {
          "id": "enjoy_more",
          "type": "multi",
          "prompt": "What do you enjoy more?",
          "hint": "Pick your favourites.",
          "options": [
            {
              "id": "building_something_from_scratch",
              "label": "Building something from scratch"
            },
            {
              "id": "solving_challenging_technical_pr",
              "label": "Solving challenging technical problems"
            },
            {
              "id": "designing_beautiful_interfaces",
              "label": "Designing beautiful interfaces"
            },
            {
              "id": "understanding_how_things_work_in",
              "label": "Understanding how things work internally"
            },
            {
              "id": "experimenting_with_new_technolog",
              "label": "Experimenting with new technologies"
            },
            {
              "id": "improving_existing_products",
              "label": "Improving existing products"
            },
            {
              "id": "working_with_people_and_understa",
              "label": "Working with people and understanding their problems"
            }
          ]
        },
        {
          "id": "three_months",
          "type": "longtext",
          "prompt": "If you could spend the next three months building anything without restrictions, what would you build?"
        },
        {
          "id": "learn_style",
          "type": "multi",
          "prompt": "How do you prefer learning?",
          "options": [
            {
              "id": "building_real_projects",
              "label": "Building real projects"
            },
            {
              "id": "watching_tutorials_and_following",
              "label": "Watching tutorials and following courses"
            },
            {
              "id": "reading_documentation_and_explor",
              "label": "Reading documentation and exploring independently"
            },
            {
              "id": "discussing_and_learning_with_oth",
              "label": "Discussing and learning with others"
            },
            {
              "id": "a_combination_of_these",
              "label": "A combination of these"
            }
          ]
        },
        {
          "id": "want_learn",
          "type": "text",
          "prompt": "What's one technical thing you've always wanted to learn but haven't started yet?"
        }
      ]
    },
    {
      "id": "work",
      "heading": "How I Work",
      "title": "How you work & learn",
      "intro": "Your habits, your style, and what keeps you going.",
      "commit": "docs: describe how I work",
      "doodle": "duck",
      "bitLine": "Everyone works differently. Spill the tea ☕",
      "questions": [
        {
          "id": "stuck",
          "type": "longtext",
          "prompt": "When you face a problem you don't know how to solve, what do you usually do?"
        },
        {
          "id": "solo_or_help",
          "type": "scale",
          "prompt": "Do you prefer figuring things out independently or asking someone for help?",
          "scale": {
            "min": 1,
            "max": 5,
            "minLabel": "Figure it out alone",
            "maxLabel": "Ask for help"
          }
        },
        {
          "id": "try_new",
          "type": "scale",
          "prompt": "How comfortable are you with trying something completely new, knowing you might fail?",
          "scale": {
            "min": 1,
            "max": 5,
            "minLabel": "Very uncomfortable",
            "maxLabel": "Bring it on"
          }
        },
        {
          "id": "lose_interest",
          "type": "longtext",
          "prompt": "What usually makes you lose interest in something you're learning?"
        },
        {
          "id": "team_size",
          "type": "single",
          "prompt": "Do you enjoy working alone, with one or two people, or in a bigger team?",
          "hint": "Tell me why in the box below.",
          "options": [
            {
              "id": "alone",
              "label": "Alone"
            },
            {
              "id": "with_one_or_two_people",
              "label": "With one or two people"
            },
            {
              "id": "in_a_bigger_team",
              "label": "In a bigger team"
            },
            {
              "id": "depends_on_the_task",
              "label": "Depends on the task",
              "other": true
            }
          ]
        },
        {
          "id": "disagree",
          "type": "longtext",
          "prompt": "What happens when someone disagrees with your technical decision or gives negative feedback?"
        },
        {
          "id": "finisher",
          "type": "single",
          "prompt": "Are you someone who starts many things but struggles to finish them, or someone who prefers completing one thing before moving to another?",
          "options": [
            {
              "id": "i_start_many_things_finishing_is",
              "label": "I start many things, finishing is hard"
            },
            {
              "id": "i_finish_one_thing_before_the_ne",
              "label": "I finish one thing before the next"
            },
            {
              "id": "somewhere_in_between",
              "label": "Somewhere in between"
            }
          ]
        },
        {
          "id": "time_mgmt",
          "type": "longtext",
          "prompt": "How do you manage your time between studies, personal life, learning and other activities?"
        }
      ]
    },
    {
      "id": "strengths",
      "heading": "Strengths",
      "title": "Confidence, strengths & things you struggle with",
      "intro": "This section is a little more personal. Be as open as you feel comfortable being — and skip anything you like.",
      "commit": "docs: add strengths and growth areas",
      "doodle": "pencil",
      "bitLine": "Deep breath. This is a safe space 🫶",
      "questions": [
        {
          "id": "naturally_good",
          "type": "longtext",
          "prompt": "What do you think you're naturally good at?",
          "hint": "It doesn't have to be technical."
        },
        {
          "id": "want_improve",
          "type": "longtext",
          "prompt": "What's something you feel you're not good at, but genuinely want to improve?"
        },
        {
          "id": "confidence_ideas",
          "type": "scale",
          "prompt": "How confident are you when expressing your ideas in front of others?",
          "scale": {
            "min": 1,
            "max": 5,
            "minLabel": "Not at all",
            "maxLabel": "Very confident"
          }
        },
        {
          "id": "hesitate",
          "type": "longtext",
          "prompt": "Do you sometimes hesitate to share your ideas because you're afraid they might sound stupid or people might judge you?"
        },
        {
          "id": "insecure",
          "type": "longtext",
          "prompt": "What makes you feel insecure about yourself, your skills or your career?"
        },
        {
          "id": "holds_back",
          "type": "longtext",
          "prompt": "Is there anything that frequently holds you back from doing something you actually want to do?"
        },
        {
          "id": "habit_change",
          "type": "longtext",
          "prompt": "What is one weakness or habit you'd really like to change?"
        },
        {
          "id": "peers_better",
          "type": "longtext",
          "prompt": "When you see someone your age doing much better than you, how do you usually feel?"
        },
        {
          "id": "responsibility",
          "type": "longtext",
          "prompt": "Are you comfortable taking responsibility for something even when you aren't completely sure how to handle it?"
        },
        {
          "id": "wish_understood",
          "type": "longtext",
          "prompt": "What's one thing you wish people understood about you?"
        }
      ]
    },
    {
      "id": "online",
      "heading": "Online",
      "title": "Your online presence & community",
      "intro": "Where you hang out on the internet, and how you feel about sharing.",
      "commit": "chore: link online profiles",
      "doodle": "cursor",
      "bitLine": "Don't worry, I won't stalk you. Much. 👀",
      "questions": [
        {
          "id": "linkedin_use",
          "type": "longtext",
          "prompt": "Do you actively use LinkedIn? What do you usually do there?"
        },
        {
          "id": "github_use",
          "type": "longtext",
          "prompt": "Do you have a GitHub account? How actively do you use it?"
        },
        {
          "id": "community",
          "type": "longtext",
          "prompt": "Do you contribute to open-source projects, share your work, write technical posts or participate in developer communities?"
        },
        {
          "id": "share_public",
          "type": "longtext",
          "prompt": "Are you comfortable sharing your projects, thoughts or achievements publicly? Why or why not?"
        },
        {
          "id": "platforms",
          "type": "multi",
          "prompt": "What platforms do you spend most of your time on?",
          "options": [
            {
              "id": "linkedin",
              "label": "LinkedIn"
            },
            {
              "id": "github",
              "label": "GitHub"
            },
            {
              "id": "instagram",
              "label": "Instagram"
            },
            {
              "id": "x",
              "label": "X"
            },
            {
              "id": "reddit",
              "label": "Reddit"
            },
            {
              "id": "youtube",
              "label": "YouTube"
            },
            {
              "id": "discord",
              "label": "Discord"
            },
            {
              "id": "other",
              "label": "Other",
              "other": true
            }
          ]
        },
        {
          "id": "stopped_posting",
          "type": "longtext",
          "prompt": "Have you ever wanted to post something technical or creative but stopped yourself? What stopped you?"
        },
        {
          "id": "follow",
          "type": "longtext",
          "prompt": "Whose content do you regularly follow?",
          "hint": "Developers, creators, entrepreneurs, educators or anyone else."
        },
        {
          "id": "profile_links",
          "type": "fields",
          "prompt": "Links to your profiles",
          "hint": "Only if you want to share.",
          "fields": [
            {
              "key": "linkedin",
              "label": "LinkedIn",
              "placeholder": "https://linkedin.com/in/…"
            },
            {
              "key": "github",
              "label": "GitHub",
              "placeholder": "https://github.com/…"
            },
            {
              "key": "portfolio",
              "label": "Portfolio / website",
              "placeholder": "https://…"
            },
            {
              "key": "other",
              "label": "Any other profile",
              "placeholder": "https://…"
            }
          ],
          "card": "links"
        }
      ]
    },
    {
      "id": "together",
      "heading": "Contributing",
      "title": "Working together & expectations",
      "intro": "What you want from this group, and what you'd bring to it.",
      "commit": "docs: add CONTRIBUTING notes",
      "doodle": "chat",
      "bitLine": "Teamwork makes the dream work 🤝",
      "questions": [
        {
          "id": "why_group",
          "type": "longtext",
          "prompt": "What made you interested in being part of this group?"
        },
        {
          "id": "hoping_get",
          "type": "longtext",
          "prompt": "What are you hoping to get out of this experience?"
        },
        {
          "id": "contribute_beyond",
          "type": "longtext",
          "prompt": "What would you like to contribute to the group apart from writing code?"
        },
        {
          "id": "best_env",
          "type": "longtext",
          "prompt": "What kind of team environment helps you perform your best?"
        },
        {
          "id": "leadership",
          "type": "multi",
          "prompt": "What kind of leadership do you prefer?",
          "options": [
            {
              "id": "someone_who_gives_clear_instruct",
              "label": "Someone who gives clear instructions and direction"
            },
            {
              "id": "someone_who_gives_freedom_and_le",
              "label": "Someone who gives freedom and lets me figure things out"
            },
            {
              "id": "someone_who_challenges_me_and_pu",
              "label": "Someone who challenges me and pushes me beyond my comfort zone"
            },
            {
              "id": "someone_who_guides_and_supports_",
              "label": "Someone who guides and supports me whenever needed"
            },
            {
              "id": "a_combination_of_these",
              "label": "A combination of these"
            }
          ]
        },
        {
          "id": "ownership",
          "type": "longtext",
          "prompt": "How do you feel about taking ownership of something rather than just completing assigned tasks?"
        },
        {
          "id": "outside_comfort",
          "type": "longtext",
          "prompt": "Would you be interested in exploring things outside your comfort zone?",
          "hint": "Product discussions, client interactions, business ideas, presentations or managing small initiatives."
        },
        {
          "id": "time_available",
          "type": "text",
          "prompt": "How much time can you realistically dedicate to group activities and projects alongside your studies or other responsibilities?",
          "placeholder": "e.g. 6–8 hours a week"
        },
        {
          "id": "lose_interest_team",
          "type": "longtext",
          "prompt": "What would make you lose interest in being part of a team like this?"
        },
        {
          "id": "expect_people",
          "type": "longtext",
          "prompt": "What is something you absolutely expect from the people you work with?"
        }
      ]
    },
    {
      "id": "setup",
      "heading": "Setup",
      "title": "Your setup & tech environment",
      "intro": "Let's talk about your everyday development environment!",
      "commit": "chore: document dev setup",
      "doodle": "keycap",
      "bitLine": "Show me your setup. I won't judge your 4GB RAM 👀",
      "questions": [
        {
          "id": "device",
          "type": "single",
          "prompt": "What device do you currently use for development?",
          "options": [
            {
              "id": "laptop",
              "label": "Laptop"
            },
            {
              "id": "desktop_pc",
              "label": "Desktop PC"
            },
            {
              "id": "both",
              "label": "Both"
            },
            {
              "id": "other",
              "label": "Other",
              "other": true
            }
          ],
          "card": "device"
        },
        {
          "id": "brand_model",
          "type": "text",
          "prompt": "What is your system's brand and model?",
          "placeholder": "e.g. HP Pavilion 15, MacBook Air M2, Custom PC"
        },
        {
          "id": "specs",
          "type": "fields",
          "prompt": "What are your system specifications?",
          "hint": "Rough is fine. Leave blank what you don't know.",
          "fields": [
            {
              "key": "cpu",
              "label": "Processor",
              "placeholder": "Intel i5, Ryzen 5, Apple M2…"
            },
            {
              "key": "ram",
              "label": "RAM",
              "placeholder": "8GB, 16GB, 32GB…"
            },
            {
              "key": "storage",
              "label": "Storage",
              "placeholder": "256GB SSD, 1TB HDD…"
            },
            {
              "key": "gpu",
              "label": "Graphics card",
              "placeholder": "If applicable"
            }
          ]
        },
        {
          "id": "os",
          "type": "single",
          "prompt": "Which operating system do you currently use?",
          "hint": "If Linux, tell me which distro.",
          "options": [
            {
              "id": "windows_10",
              "label": "Windows 10"
            },
            {
              "id": "windows_11",
              "label": "Windows 11"
            },
            {
              "id": "macos",
              "label": "macOS"
            },
            {
              "id": "linux",
              "label": "Linux",
              "other": true
            },
            {
              "id": "other",
              "label": "Other",
              "other": true
            }
          ],
          "card": "os"
        },
        {
          "id": "os_comfort",
          "type": "longtext",
          "prompt": "Are you comfortable working with different operating systems, or do you prefer sticking with your current one?"
        },
        {
          "id": "dev_tools",
          "type": "text",
          "prompt": "Which development tools do you regularly use?",
          "placeholder": "VS Code, WebStorm, Android Studio, Cursor, Windsurf…"
        },
        {
          "id": "ai_tools",
          "type": "text",
          "prompt": "Do you use AI coding tools? If yes, which ones?",
          "placeholder": "ChatGPT, Claude, GitHub Copilot, Cursor, Gemini…"
        },
        {
          "id": "system_enough",
          "type": "longtext",
          "prompt": "Is your current system good enough for the kind of development you want to do? Are there any limitations you face?"
        },
        {
          "id": "upgrade_one",
          "type": "text",
          "prompt": "If you could upgrade or change one thing about your current development setup, what would it be?"
        },
        {
          "id": "internet_space",
          "type": "longtext",
          "prompt": "Do you have access to a reliable internet connection and a suitable workspace for development?"
        },
        {
          "id": "wish_access",
          "type": "longtext",
          "prompt": "Are there any tools, software, subscriptions or hardware resources you wish you had access to?"
        },
        {
          "id": "env_experiment",
          "type": "longtext",
          "prompt": "What kind of development environment would you love to experiment with?",
          "hint": "Linux, macOS, cloud development, self-hosted servers, multiple monitors…"
        }
      ]
    },
    {
      "id": "explore",
      "heading": "Explore",
      "title": "Technologies you want to explore",
      "intro": "This is about curiosity, not your current skill level.",
      "commit": "feat: add roadmap of curiosities",
      "doodle": "telescope",
      "bitLine": "Curiosity mode: ON 🔭",
      "questions": [
        {
          "id": "languages",
          "type": "text",
          "prompt": "Which programming languages would you love to learn or become better at?",
          "card": "languages"
        },
        {
          "id": "frameworks",
          "type": "text",
          "prompt": "Which frameworks or technologies are you curious about?"
        },
        {
          "id": "outside_areas",
          "type": "multi",
          "prompt": "Are there any areas outside your current development experience that you'd like to explore?",
          "options": [
            {
              "id": "artificial_intelligence_machine_",
              "label": "Artificial Intelligence / Machine Learning"
            },
            {
              "id": "generative_ai_llms",
              "label": "Generative AI / LLMs"
            },
            {
              "id": "ai_agents_and_automation",
              "label": "AI Agents and automation"
            },
            {
              "id": "robotics_iot",
              "label": "Robotics / IoT"
            },
            {
              "id": "cloud_computing_and_infrastructu",
              "label": "Cloud computing and infrastructure"
            },
            {
              "id": "devops_and_system_architecture",
              "label": "DevOps and system architecture"
            },
            {
              "id": "cybersecurity",
              "label": "Cybersecurity"
            },
            {
              "id": "blockchain_web3",
              "label": "Blockchain / Web3"
            },
            {
              "id": "game_development",
              "label": "Game development"
            },
            {
              "id": "data_engineering",
              "label": "Data engineering"
            },
            {
              "id": "ar_vr",
              "label": "AR / VR"
            },
            {
              "id": "embedded_systems",
              "label": "Embedded systems"
            },
            {
              "id": "other",
              "label": "Other",
              "other": true
            }
          ],
          "card": "explore"
        },
        {
          "id": "didnt_know_start",
          "type": "longtext",
          "prompt": "Have you ever wanted to build something but didn't know where to start? Tell me about it."
        },
        {
          "id": "emerging_tech",
          "type": "single",
          "prompt": "Would you be interested in experimenting with technologies that aren't yet widely used or are still evolving?",
          "options": [
            {
              "id": "absolutely",
              "label": "Absolutely"
            },
            {
              "id": "maybe_depends_on_what",
              "label": "Maybe, depends on what"
            },
            {
              "id": "not_really",
              "label": "Not really"
            },
            {
              "id": "let_me_explain",
              "label": "Let me explain",
              "other": true
            }
          ]
        },
        {
          "id": "interests_more",
          "type": "multi",
          "prompt": "What interests you more?",
          "options": [
            {
              "id": "understanding_how_things_work_in",
              "label": "Understanding how things work internally"
            },
            {
              "id": "building_products_that_people_ca",
              "label": "Building products that people can actually use"
            },
            {
              "id": "researching_new_technologies",
              "label": "Researching new technologies"
            },
            {
              "id": "creating_tools_that_solve_everyd",
              "label": "Creating tools that solve everyday problems"
            },
            {
              "id": "experimenting_with_unusual_or_ch",
              "label": "Experimenting with unusual or challenging ideas"
            }
          ]
        },
        {
          "id": "unlimited_access",
          "type": "longtext",
          "prompt": "If you had access to any hardware, software, cloud infrastructure or paid developer tools, what would you like to experiment with?"
        },
        {
          "id": "never_work",
          "type": "longtext",
          "prompt": "Is there a technology or development area you would never want to work with? Why?"
        }
      ]
    },
    {
      "id": "final",
      "heading": "Final Notes",
      "title": "A few final questions",
      "intro": "Almost there. These ones matter a lot.",
      "commit": "release: v1.0",
      "doodle": "cat",
      "bitLine": "Final boss questions. You've got this ⚔️",
      "questions": [
        {
          "id": "change_learning",
          "type": "longtext",
          "prompt": "If you could change one thing about the way you currently learn or develop yourself, what would it be?"
        },
        {
          "id": "postponing",
          "type": "longtext",
          "prompt": "What's something you've been postponing for a long time but really want to do?"
        },
        {
          "id": "opportunities",
          "type": "longtext",
          "prompt": "What kind of opportunities would excite you the most?"
        },
        {
          "id": "career_fear",
          "type": "longtext",
          "prompt": "Is there anything you're afraid of when thinking about your career or future?"
        },
        {
          "id": "prove_self",
          "type": "longtext",
          "prompt": "What is one thing you want to prove to yourself?"
        },
        {
          "id": "six_months",
          "type": "longtext",
          "prompt": "If I could help you improve one thing over the next six months, what would you want it to be?"
        },
        {
          "id": "anything_else",
          "type": "longtext",
          "prompt": "Is there anything else you want to tell me? Something I didn't ask but you think I should know?"
        }
      ]
    }
  ]
};
