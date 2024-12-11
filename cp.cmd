@ECHO OFF
set src=%1
set trg=%2
set src=%src:/=\%
set trg=%trg:/=\%
@ECHO ON
copy /Y "%src%" "%trg%"


