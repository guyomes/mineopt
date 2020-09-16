Mine optimizer is a tool based on linear optimization to minimize the time
required to get the materials necessary to build a given ship. 

The page is divided in three forms: the skills, the ship target and the
result form. The computation is performed each time a field is modified and
the result is updated accordingly in real time.


# Skills form

The first form lets you fill your processing and manufacturing
stats. It also lets you enter the maximal volume of materials that your
cargo can take, as well as the time to mine one batch of material.

## Processing skills
The processing skills are used to compute the processing efficiency. For
the material `Veldspar`, of type `Common`, the base quantity of materials
processed is given in the file [base_yield.json], and it is multiplied by
the coefficient:

<p align="center">
<img src=
"https://render.githubusercontent.com/render/math?math=%5Cdisplaystyle+0.3+%2B+0.3%5Cleft%5B0.1+X_%7BBasic%7D+%2B+0.05+%28X_%7BAdvanced%7D%2B%5Cdelta_%7BAdvanced%7D+%29%2B+0.05+X_%7BExpert%7D%5Cright%5D" 
alt="0.3 + 0.3(0.1 X_{Basic} + 0.05 (X_{Advanced}+\delta_{Advanced} )+ 0.05 X_{Expert}) 
">
</p>

where
<img src= "https://render.githubusercontent.com/render/math?math=%5Ctextstyle+X_%7BBasic%7D" alt="X_{Basic}">,
<img src= "https://render.githubusercontent.com/render/math?math=%5Ctextstyle+X_%7BAdvanced%7D" alt="X_{Advanced}"> and
<img src= "https://render.githubusercontent.com/render/math?math=%5Ctextstyle+X_%7BExpert%7D" alt="X_{Expert}">
are the skill points to process `Common` materials, and 
<img src= "https://render.githubusercontent.com/render/math?math=%5Ctextstyle+%5Cdelta_%7BBasic%7D" alt="\delta_{Basic}">
is 1 if 
<img src= "https://render.githubusercontent.com/render/math?math=%5Ctextstyle+X_%7BAdvanced%7D+%5Cgeq+1" alt="X_{Advanced} \geq 1">
and 0 otherwise. The final number gives the quantity of processed materials
used for the coefficients of the matrix in the linear optimization problem.
The formula is the same for all the materials.


## Manufacturing skills
The manufacturing skills are used to compute the cost reduction to build a
ship. The base cost of the ships is given in the file
[targets.json], and is multiplied by the coefficient:

<p align="center">
<img src=
"https://render.githubusercontent.com/render/math?math=%5Cdisplaystyle+1+-+%5Cfrac%7B6+X_%7BBasic%7D+-+4+X_%7BAdvanced%7D+-+X_%7BExpert%7D%7D%7B150%7D" 
alt="1 - \frac{6 X_{Basic} - 4 X_{Advanced} - X_{Expert}}{150}">
</p>

where
<img src= "https://render.githubusercontent.com/render/math?math=%5Ctextstyle+X_%7BBasic%7D" alt="X_{Basic}">,
<img src= "https://render.githubusercontent.com/render/math?math=%5Ctextstyle+X_%7BAdvanced%7D" alt="X_{Advanced}"> and
<img src= "https://render.githubusercontent.com/render/math?math=%5Ctextstyle+X_%7BExpert%7D" alt="X_{Expert}">
are the skill points to process a ship of the corresponding type. The
result is used for the lower bounds in the linear optimization problem.

# Ships form

The ship form lets you choose the ship you want to build, and the desired
quantity. The right column will be filled with the corresponding cost, and
the left column allows you to input the materials that you already have.
The costs in the right column can also be edited freely.

# Results form
The field in this form are read only. They display the total number of trip
and time to collect all the raw materials necessary to reach the desired
quantities of processed materials. These fields are updated each time
another field is updated, using the simplex algorithm implemented in the
software [glpk](https://www.gnu.org/software/glpk/), interfaced for
javascript with the library [glpk.js].


[base_yield.json]: https://github.com/guyomes/mineopt/blob/master/data/base_yield.json
[targets.json]: https://github.com/guyomes/mineopt/blob/master/data/targets.json
[glpk]: https://www.gnu.org/software/glpk
[glpk.js]: https://github.com/jvail/glpk.js
