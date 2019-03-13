import * as c from 'ansi-colors'
import cpFile from 'cp-file'
import globby from 'globby'
import * as path from 'path'
import * as yargs from 'yargs'

export interface KpyOptions {
  baseDir: string
  inputPatterns?: string[]
  outputDir: string
  silent?: boolean
  noOverwrite?: boolean
  dotfiles?: boolean
  flat?: boolean
  dry?: boolean
}

export async function kpyCLI (): Promise<void> {
  const { _: args, silent, overwrite, dotfiles, flat, dry } = yargs.demandCommand(2).options({
    silent: {
      type: 'boolean',
    },
    overwrite: {
      type: 'boolean',
      default: true,
    },
    dotfiles: {
      type: 'boolean',
    },
    flat: {
      type: 'boolean',
    },
    dry: {
      type: 'boolean',
    },
  }).argv

  const [baseDir, ...inputPatterns] = args
  const outputDir = inputPatterns.pop()!

  /*
  console.log({
    argv: process.argv,
    baseDir,
    inputPatterns,
    outputDir,
    silent,
    overwrite,
  })*/

  await kpy({
    baseDir,
    inputPatterns,
    outputDir,
    silent,
    noOverwrite: !overwrite,
    dotfiles,
    flat,
    dry,
  })
}

export async function kpy (opt: KpyOptions): Promise<void> {
  let { baseDir, inputPatterns, outputDir, silent, noOverwrite, dotfiles, flat, dry } = opt

  // Default pattern
  inputPatterns = inputPatterns || []
  if (!inputPatterns.length) inputPatterns = ['**']

  baseDir = baseDir || '.' // default to cwd
  outputDir = outputDir || '.' // default to cwd

  const filenames = await globby(inputPatterns, {
    cwd: baseDir,
    dot: dotfiles,
  })

  // console.log({filenames})
  if (!silent) {
    console.log(
      c.grey(
        `Will copy ${filenames.length} files from ${baseDir} to ${outputDir} (${inputPatterns.join(
          ' ',
        )})`,
      ),
    )
  }

  await Promise.all(
    filenames.map(async filename => {
      const basename = path.basename(filename)
      const srcFilename = path.resolve(baseDir, filename)
      const destFilename = path.resolve(outputDir, flat ? basename : filename)

      if (!dry) {
        await cpFile(srcFilename, destFilename, {
          overwrite: !noOverwrite,
        })
      }

      if (!silent) {
        console.log(c.grey(`  ${filename}`))
      }

      // console.log({filename, basename, srcFilename, destFilename})
    }),
  )

  if (!silent && filenames.length) {
    console.log(c.grey(`Copied ${c.grey.bold('' + filenames.length)} files to ${outputDir}`))
  }
}
