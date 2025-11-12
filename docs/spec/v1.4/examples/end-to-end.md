# End-to-End Example
User: !<g>
Assistant: <g>
[Version=v1.4 | Tag=g_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=instructions-prompt]

User: !<q>
Assistant: <q>
[Version=v1.4 | Tag=q_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=instructions-prompt]

User: !<o>
Assistant: <o>
[Version=v1.4 | Tag=o_1 | Sources=none | Assumptions=2 | Cycle=1/3 | Locus=instructions-prompt]

User: !<c>
Assistant: <c>
[Version=v1.4 | Tag=c_1 | Sources=none | Assumptions=0 | Cycle=2/3 | Locus=instructions-prompt]

# Locus jump
User: !<e> --<g>
Assistant: <g>
[Version=v1.4 | Tag=g_2 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=new-locus]
