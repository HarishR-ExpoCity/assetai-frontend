@echo off

call :GET_CURRENTTIME startTime
call :GET_RANDOMNUMBER randomNumber

for /f "tokens=1,2 delims==" %%a in (.env) do (
    set %%a=%%b
    call :de_quote %%a
)

set USER_ID=1111
set USER_NAME=dome
set GROUP_ID=1111
set MOUNT_PATH="/home/%USER_NAME%/code"

set IMAGE_NAME=%PROJECT_NAME%:%PROJECT_MODE%
docker image build ^
    --build-arg=USER_ID=%USER_ID% --build-arg=USER_NAME=%USER_NAME% --build-arg=GROUP_ID=%GROUP_ID% ^
    --tag=%IMAGE_NAME% .
echo|set /p="New docker image %IMAGE_NAME% is created"

echo.
echo.
set CONTAINER_NAME=%PROJECT_NAME%_%PROJECT_MODE%
docker create ^
    --gpus=all ^
    --mount="type=bind,source=.,target=%MOUNT_PATH%" ^
    --add-host=host.internal:host-gateway --publish=%APPLICATION_PORT%:3000 ^
    --restart=unless-stopped ^
    --health-cmd="curl -f http://localhost:3000%APPLICATION_ROOT%/ || exit 1" --health-start-period=30s --health-interval=30s --health-timeout=30s --health-retries=5 ^
    --entrypoint=%MOUNT_PATH%/on_start.sh ^
    --name=%CONTAINER_NAME% %IMAGE_NAME%
docker start %CONTAINER_NAME%
echo|set /p="New docker container %CONTAINER_NAME% is created"

echo.
echo.
call :GET_CURRENTTIME endTime
echo|set /p="Started on %startTime% | Ended on %endTime%"
echo.
echo.
echo.
goto :END

:GET_RANDOMNUMBER
    for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set datetime=%%a
    set "%1=%datetime:~0,4%%datetime:~4,2%%datetime:~6,2%%datetime:~8,2%%datetime:~10,2%%datetime:~12,2%"
goto :END

:GET_CURRENTTIME
    for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set datetime=%%a
    set "%1=%datetime:~0,4%/%datetime:~4,2%/%datetime:~6,2%-%datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%"
goto :END

:de_quote
    for /f "delims=" %%a in ('echo %%%1%%') do set %1=%%~a
goto :END

:END
