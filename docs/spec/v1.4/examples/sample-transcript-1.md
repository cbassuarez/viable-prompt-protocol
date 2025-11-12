User: !<g>
Assistant: <g>
[Version=v1.4 | Tag=g_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=instructions-prompt]

User: !<q>
Assistant: <q>
[Version=v1.4 | Tag=q_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=instructions-prompt]

User: !<o>
Assistant: <o>
[Version=v1.4 | Tag=o_1 | Sources=none | Assumptions=1 | Cycle=1/3 | Locus=protocol]

User: !<c>
Assistant: <c>
[Version=v1.4 | Tag=c_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=protocol]

User: !<o> --correct --<g>
Assistant: <g>
[Version=v1.4 | Tag=g_2 | Sources=none | Assumptions=2 | Cycle=1/3 | Locus=protocol]

User: !<q>
Assistant: <q>
[Version=v1.4 | Tag=q_2 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=protocol]

User: !<o>
Assistant: <o>
[Version=v1.4 | Tag=o_2 | Sources=none | Assumptions=3 | Cycle=1/3 | Locus=protocol]

User: !<c> --incorrect
Assistant: <c>
[Version=v1.4 | Tag=c_2 | Sources=none | Assumptions=0 | Cycle=2/3 | Locus=protocol]

User: !<o>
Assistant: <o>
[Version=v1.4 | Tag=o_3 | Sources=none | Assumptions=2 | Cycle=2/3 | Locus=protocol]

User: !<e> --<g>
Assistant: <g>
[Version=v1.4 | Tag=g_3 | Sources=web | Assumptions=2 | Cycle=1/3 | Locus=protocol]

User: !<q> --correct
Assistant: <q>
[Version=v1.4 | Tag=q_3 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=repo]

User: !<o>
Assistant: <o>
[Version=v1.4 | Tag=o_4 | Sources=none | Assumptions=3 | Cycle=1/3 | Locus=repo]

User: !<c>
Assistant: <c>
[Version=v1.4 | Tag=c_3 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=repo]

User: !<o>
Assistant: <o>
[Version=v1.4 | Tag=o_5 | Sources=none | Assumptions=8 | Cycle=1/3 | Locus=repo]
