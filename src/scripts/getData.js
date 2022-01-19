#!/usr/bin/node

// NodeJS Native
const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs');

// NPM Libraries
const program = require('commander');
const _ = require('lodash');

// Local
const pkg = require('../../package.json');

program
  .version(pkg.version, '-v, --version')
  .description('Process directories with cloc and create the ../data/languages.json file\n\n\tExample: node ./scr/scripts/getData.js repodir1 repodir2 repodir3 ...')
  .command('stat [dirs...]', {isDefault: true})
  .action(function (dirs) {
    let languages = {
      total: {
        lineDomain: {
          min: 9999,
          max: 1,
        },
        fileDomain: {
          min: 9999,
          max: 1,
        },
      },
    };
    let projects = {};
    let projectInfo = {};

    dirs.forEach(function (dir) {
      const excludeBase = [
        '.git',
        'bin',
        'data',
        'node_modules',
        '.idea',
        'build',
        'dist',
      ];
      const cmd = `/usr/bin/cloc --fullpath --not-match-d='(${excludeBase.join('|')})' --json ./`;

      let codeStat = false;

      console.debug(`Executing: ${cmd} in ${dir}`);

      try{
        codeStat = execSync(cmd, {cwd: dir});
      } catch (e) {
        console.error(`Unable to cloc ${dir}`);
      }

      if (codeStat) {
        let project = `${dir.replace(path.dirname(dir), '').replace(/\//, '')}`;

        try {
          let codeStatJSON = JSON.parse(codeStat.toString().replace(/\n/, ''));

          languages[project] = {
            lineDomain: {
              min: 9999,
              max: 1,
            },
            fileDomain: {
              min: 9999,
              max: 1,
            },
          };

          _.map(codeStatJSON, (languageStat, language) => {

            if(
              language.indexOf('SUM') === -1 &&
              language.indexOf('header') === -1
            ) {
              language = language;

              languages[project][language] = {
                files: languageStat.nFiles,
                lines: languageStat.code,
              };

              if (_.isUndefined(languages['total'][language])) {
                languages['total'][language] = {
                  files: languageStat.nFiles,
                  lines: languageStat.code,
                };
              } else {
                languages['total'][language]["files"] += languageStat.nFiles;
                languages['total'][language]["lines"] += languageStat.code;
              }

              if(_.isUndefined(projects[language])) {
                projects[language] = [];
              }

              projects[language].push(project);

              //project domain
              if (languages[project].lineDomain.min > languages[project][language].lines) {
                languages[project].lineDomain.min = languages[project][language].lines;
              }

              if (languages[project].lineDomain.max < languages[project][language].lines) {
                languages[project].lineDomain.max = languages[project][language].lines;
              }

              if (languages[project].fileDomain.min > languages[project][language].files) {
                languages[project].fileDomain.min = languages[project][language].files;
              }

              if (languages[project].fileDomain.max < languages[project][language].files) {
                languages[project].fileDomain.max = languages[project][language].files;
              }

              // languages totals domain
              if (languages.total.lineDomain.min > languages['total'][language].lines) {
                languages.total.lineDomain.min = languages['total'][language].lines;
              }
              if (languages.total.lineDomain.max < languages['total'][language].lines) {
                languages.total.lineDomain.max = languages['total'][language].lines;
              }

              if (languages.total.fileDomain.min > languages['total'][language].files) {
                languages.total.fileDomain.min = languages['total'][language].files;
              }
              if (languages.total.fileDomain.max < languages['total'][language].files) {
                languages.total.fileDomain.max = languages['total'][language].files;
              }
            }
          });
        } catch (e) {
          console.error(e);
          console.error(`Unable to read cloc output for ${dir}`);
        }

        let skilzInfo = false;

        try {
          skilzInfo = execSync('cat ./.skilz', {cwd: dir});
          skilzInfo = JSON.parse(skilzInfo.toString().replace(/\n/, ''));
        } catch (e) {
          console.error(`no skilzInfo found for ${dir}`);
        }

        try {
          let authors = [];

          try {
            authors = execSync(`git shortlog -sn ${skilzInfo.branch}`, {cwd: dir}).toString().split('\n');
          } catch(e) {
            console.error(`Unable to process ${dir}`);
            process.exit(-1);
          }

          authors = _.filter(_.map(authors, (author) => {
            return author.replace(/.*\t/, '');
          }), (author) => !_.isEmpty(author));

          if (!skilzInfo) {
            skilzInfo = {
              gitstats: {},
            };
          } else {
            skilzInfo.gitstats = {};
          }
          skilzInfo.authors = authors;

          skilzInfo.gitstats['total'] = {
            commitCount: 0,
            firstCommitDate: execSync('git log --pretty=format:"%ci" --reverse | head -n 1', {cwd: dir}).toString().replace(/\n/, ''),
            lastCommitDate: execSync('git log --pretty=format:"%ci" | head -n 1', {cwd: dir}).toString().replace(/\n/, ''),
            daysOfWork: 0,
            lineCount: 0,
            fileCount: 0,
          };

          _.forEach(authors, (author) => {

            if (_.isUndefined(skilzInfo.gitstats[author])) {
              skilzInfo.gitstats[author] = {
                linesInCode: 0,
              };
            }

            let numstat = execSync(`git log --author="${author}" --pretty=tformat: --numstat | gawk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "%s,%s,%s", add, subs, loc }'`, {cwd: dir}).toString().split(',');
            let deletedFileCount = Number(execSync(`git log --author="${author}" --pretty=tformat: --numstat --follow -p ./ | grep "deleted file" | wc -l`, {cwd: dir}).toString());
            let createdFileCount = Number(execSync(`git log --author="${author}" --pretty=tformat: --follow -p ./ | grep 'new file mode' | wc -l`, {cwd: dir}).toString());

            let commitCount = 0;

            try {
              commitCount = execSync(`git rev-list --count ${skilzInfo.branch} --author "${author}"`, {cwd: dir}).toString().replace(/\n/, '').replace(/\s+/, '');
            } catch(e) {
              console.error(`Unable to get commit count for ${dir}`);
              process.exit(-2);
            }

            skilzInfo.gitstats[author] = {
              firstCommitDate: execSync(`git log --pretty=format:"%ci" --reverse --author "${author}" | head -n 1`, {cwd: dir}).toString().replace(/\n/, ''),
              lastCommitDate: execSync(`git log --pretty=format:"%ci" --author "${author}" | head -n 1`, {cwd: dir}).toString().replace(/\n/, ''),
              daysOfWork: Number(execSync(`git log --author="${author}" | grep "^Date" | awk '{print $2 " "  $3 " " $4}' | uniq | wc -l`, {cwd: dir}).toString().replace(/\n/, '')),
              commitCount: Number(commitCount),
              numstatFile: {
                added: createdFileCount,
                removed: deletedFileCount,
                total: createdFileCount - deletedFileCount,
              },
              numstatLine: {
                added: Number(numstat[0]),
                removed: Number(numstat[1]),
                total: Number(numstat[2]),
              },
            };
            skilzInfo.gitstats['total'].commitCount += skilzInfo.gitstats[author].commitCount;
            skilzInfo.gitstats['total'].daysOfWork += skilzInfo.gitstats[author].daysOfWork;
            skilzInfo.gitstats['total'].lineCount += skilzInfo.gitstats[author].numstatFile.total;
            skilzInfo.gitstats['total'].fileCount += skilzInfo.gitstats[author].numstatLine.total;
          });

        } catch (e) {
          console.error('unable to get git stats...', e.stack);
        }

        if (skilzInfo) {
          projectInfo[project] = skilzInfo;
        }
      }
    });

    try {
      fs.writeFileSync(
        './src/data/languages.json',
        JSON.stringify(languages),
        {
          encoding: 'utf8',
        }
      );
      fs.writeFileSync(
        './src/data/languages-to-projects.json',
        JSON.stringify(projects),
        {
          encoding: 'utf8',
        }
      );
      fs.writeFileSync(
        './src/data/projectInfo.json',
        JSON.stringify(projectInfo),
        {
          encoding: 'utf8',
        }
      );
    } catch (e) {
      console.error(e);
      console.error('Unable to save json file...');
    }
  });

program.on('command:*', function () {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
